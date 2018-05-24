import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET orders
        method: 'GET',
        path: '/orders/{id?}',
        config: {
            // auth: false,
            description: 'Get orders',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id orders'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('orders').find(find).toArray();

                return {
                    data: res,
                    message: 'OK',
                    statusCode: 200,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // POST orders
        method: 'POST',
        path: '/orders',
        config: {
          //  auth: false,
            description: 'Insert orders ',
            notes: 'Insert orders ',
            tags: ['api'],
            validate: {
                payload: {
                    customerId: Joi.string().length(24).optional().description('id customer'),
                    draftOrderId: Joi.string().length(24).description('id draftOrderId'),
                    no: Joi.string().required().description('order number'),
                    /** 
                     * example 
                     *      Job : [{'name': 'Printing'
                     *               'status':'pending'
                     *               'remark': '......'},
                     *               {'name': 'Wax Injection'
                     *               'status':'pending'
                     *               'remark': '......'}]
                     */
                    job: Joi.array().items(Joi.object()).required().description('orders detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                payload.crt = Date.now();
                payload.active = true;
                // payload.status = 'In process';
                for (const key in payload.job) {
                    payload.job[key].status = 'In process';
                }
                const insert = await mongo.collection('orders').insertOne(payload);

                // Create & Insert orders-Log
                const log = Object.assign({}, payload);
                log.ordersId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'orders-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT orders
        method: 'PUT',
        path: '/orders',
        config: {
           // auth: false,
            description: 'Update orders ',
            notes: 'Update orders ',
            tags: ['api'],
            validate: {
                payload: {
                    ordersId: Joi.string().length(24).required().description('id ordersId'),
                    job: Joi.array().items().description('orders detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(payload.ordersId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.ordersId}`));
                }

                // Create Update Info & Update orders
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.ordersId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('orders').update({ _id: mongoObjectId(payload.ordersId) }, { $set: updateInfo });

                // Create & Insert orders-Log
                const writeLog = await Util.writeLog(req, payload, 'orders-log', 'update');

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Delete orders
        method: 'DELETE',
        path: '/orders/{id}',
        config: {
          //  auth: false,
            description: 'delete orders ',
            notes: 'delete orders',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id orders'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('orders').deleteOne({ _id: mongoObjectId(params.id) });

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // GET orders filter
        method: 'GET',
        path: '/orders/filter',
        config: {
           // auth: false,
            description: 'Get orders',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                payload: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix crt'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix crt'),
                    ordersId: Joi.string().length(24).optional().description('id orders'),
                    customerId: Joi.string().length(24).optional().description('id customer'),
                    userId: Joi.string().length(24).optional().description('id user'),
                    limit: Joi.number().integer().min(1).optional().description('number of data to be shown'),
                    sort: Joi.number().integer().valid([1, -1]).optional().description('1 for asc & -1 for desc'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const db = Util.getDb(req);
                const payload = req.payload;
                const options: any = { query: {}, sort: {}, limit: 0 };

                // Loop from key in payload to check query string and assign value to find/sort/limit data
                for (const key in payload) {
                    switch (key) {
                        case 'begin':
                        case 'end':
                            if (options.query.crt === undefined) {
                                options.query.crt = {};
                            }
                            key === 'begin'
                                ? options.query.crt['$gte'] = payload[key]
                                : options.query.crt['$lte'] = payload[key];
                            break;
                        case 'sort':
                            options.sort = { crt: payload[key] };
                            break;
                        case 'limit':
                            options.limit = payload;
                            break;
                        case 'ordersId':
                            options.query._id = mongoObjectId(payload[key]);
                            break;
                        case 'customerId':
                            options.query.customerId = payload[key];
                            break;
                        case 'userId':
                            options.query.customerId = payload[key];
                            break;
                        default:
                            options.query[key] = payload[key];
                            break;
                    }
                }
                const ordersLogs = await db.collection('orders').find(options.query).sort(options.sort).limit(options.limit).toArray();

                return {
                    data: ordersLogs,
                    message: 'OK',
                    statusCode: 200,
                };
            } catch (error) {
                return Boom.badGateway(error.message, error.data);
            }
        },

    },
    {  // PUT orders job status
        method: 'PUT',
        path: '/orders/update-job',
        config: {
          //  auth: false,
            description: 'Update orders ',
            notes: 'Update orders ',
            tags: ['api'],
            validate: {
                payload: {
                    ordersId: Joi.string().length(24).required().description('id ordersId'),
                    name: Joi.string().description('job name'),
                    status: Joi.string().description('job status'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(payload.ordersId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.ordersId}`));
                }

                // Create Update Info & Update orders
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.ordersId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('orders').update({ _id: mongoObjectId(payload.ordersId), "job.name": payload.name }, { $set:  { "job.$.status": payload.status }  });

                // Create & Insert orders-Log
                const writeLog = await Util.writeLog(req, payload, 'orders-log', 'update-job');

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
];
