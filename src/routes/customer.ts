import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET customer
        method: 'GET',
        path: '/customer/{id?}',
        config: {
            // auth: false,
            description: 'Get customer',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id customer'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('customer').find(find).toArray();

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
    {  // POST customer
        method: 'POST',
        path: '/customer',
        config: {
            auth: false,
            description: 'Insert customer ',
            notes: 'Insert customer ',
            tags: ['api'],
            validate: {
                payload: {
                    fullname: Joi.string().description('customer fristname'),
                    email: Joi.string().description('customer email'),
                    address: Joi.string().description('address'),
                    tel: Joi.string().description('customer phone number'),
                    username: Joi.string().required().description('customer phone number'),
                    password: Joi.string().required().description('password'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                payload.crt = Date.now();
                payload.active = true;
                payload.password = Util.hash(payload.password);

                const insert = await mongo.collection('customer').insertOne(payload);

                // Create & Insert customer-Log
                const log = Object.assign({}, payload);
                log.customerId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'customer-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT customer
        method: 'PUT',
        path: '/customer',
        config: {
            // auth: false,
            description: 'Update customer ',
            notes: 'Update customer ',
            tags: ['api'],
            validate: {
                query: {
                    customerId: Joi.string().length(24).required().description('id taskId'),
                    fullname: Joi.string().description('customer fristname'),
                    email: Joi.string().description('customer email'),
                    address: Joi.string().description('address'),
                    tel: Joi.string().description('customer phone number'),
                    password: Joi.string().description('password'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.query;
                if (payload.password) {
                    payload.password = Util.hash(payload.password);
                }


                // Check No Data
                const res = await mongo.collection('customer').findOne({ _id: mongoObjectId(payload.customerId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.customerId}`));
                }

                // Create Update Info & Update customer
                const updateInfo = Object.assign('', payload);
                delete updateInfo.customerId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('customer').update({ _id: mongoObjectId(payload.customerId) }, { $set: updateInfo });

                // Create & Insert customer-Log
                const writeLog = await Util.writeLog(req, payload, 'customer-log', 'update');

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
    {  // Delete customer
        method: 'DELETE',
        path: '/customer/{id}',
        config: {
            //auth: false,
            description: 'delete customer ',
            notes: 'delete customer',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id customer'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('customer').deleteOne({ _id: mongoObjectId(params.id) });

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
    {  // GET customer filter
        method: 'GET',
        path: '/customer/filter',
        config: {
            // auth: false,
            description: 'Get orders',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                query: {
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
                const payload = req.query;
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
                            options.query._id = payload[key];
                            break;
                        case 'customerId':
                            options.query.customerId = mongoObjectId(payload[key]);
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
];