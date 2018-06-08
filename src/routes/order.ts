import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET orders  for admin
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
                const userProfile = jwtDecode(req.headers.authorization);
                const find: any = { active: true, };
                if (userProfile.type === 'customer' || typeof userProfile.access === undefined || !userProfile.access.order.read) { return Boom.badRequest('Access Denied!'); }
                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('orders').find(find).sort({ crt: -1 }).toArray();

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
    {  // GET orders
        method: 'GET',
        path: '/orders/onwer/{id?}',
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
                const userProfile = jwtDecode(req.headers.authorization);
                const find: any = { active: true, userId: userProfile._id };
                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }
                const res = await mongo.collection('orders').find(find).sort({ crt: -1 }).toArray();

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
    {  // GET orders filter for admin
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
                query: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix crt'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix crt'),
                    ordersId: Joi.string().length(24).optional().description('id orders'),
                    orderNo: Joi.string().optional().description('orders number'),
                    userId: Joi.string().length(24).optional().description('id customer'),
                    limit: Joi.number().integer().min(1).optional().description('number of data to be shown'),
                    sort: Joi.number().integer().valid([1, -1]).optional().description('1 for asc & -1 for desc'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const db = Util.getDb(req);
                const payload = req.query;
                const options: any = { query: {}, sort: { crt: -1 }, limit: 0 };
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type === 'customer' || typeof userProfile.access === undefined || !userProfile.access.order.read) { return Boom.badRequest('Access Denied!'); }

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
                        case 'userId':
                            options.query.userId = payload[key];
                            break;
                        case 'orderNo':
                            options.query.orderNo = payload[key];
                            break;
                        default:
                            options.query[key] = payload[key];
                            break;
                    }
                }
                const order = await db.collection('orders').find(options.query).sort(options.sort).limit(options.limit).toArray();

                return {
                    data: order,
                    message: 'OK',
                    statusCode: 200,
                };

            } catch (error) {
                return Boom.badGateway(error.message, error.data);
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
                    userId: Joi.string().length(24).required().description('id customer'),
                    draftOrderId: Joi.string().length(24).description('id draftOrderId'),
                    orderNo: Joi.string().required().description('order number'),
                    job: Joi.array().items(Joi.object()).required().description('orders detail'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type === 'customer' && payload.userId !== userProfile._id) {
                    return Boom.badRequest('Invaild User');
                }
                payload.crt = Date.now();
                payload.active = true;
                // payload.status = 'In Process';

                const insert = await mongo.collection('orders').insertOne(payload);

                // update draf status to false
                const update = await mongo.collection('draftOrder').update({ _id: mongoObjectId(payload.draftOrderId) }, { $set: { active: false } });

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
    {  // PUT orders for admin
        method: 'PUT',
        path: '/orders',
        config: {
            // auth: false,
            description: 'Update orders ',
            notes: 'Update orders ',
            tags: ['api'],
            validate: {
                payload: {
                    job: Joi.array().items(Joi.object()).required().description('orders detail'),
                },
                query: {
                    id: Joi.string().length(24).required().description('id ordersId'),
                }
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const query = req.query;
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type === 'customer' || typeof userProfile.access === undefined || !userProfile.access.order.update) { return Boom.badRequest('Access Denied!'); }
                // Check No Data
                const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(query.id) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${query.id}`));
                }

                // Create Update Info & Update orders
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.ordersId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('orders').update({ _id: mongoObjectId(query.id) }, { $set: updateInfo });

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
    {  // PUT orders
        method: 'PUT',
        path: '/orders/owner',
        config: {
            // auth: false,
            description: 'Update orders ',
            notes: 'Update orders ',
            tags: ['api'],
            validate: {
                payload: {
                    job: Joi.array().items(Joi.object()).required().description('orders detail'),
                },
                query: {
                    id: Joi.string().length(24).required().description('id ordersId'),
                }
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const query = req.query;
                const userProfile = jwtDecode(req.headers.authorization);

                // Create Update Info & Update orders
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.ordersId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('orders').update({ _id: mongoObjectId(query.id) }, { $set: updateInfo });

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
    {  // GET latest Order Number
        method: 'GET',
        path: '/orders/latestnumber',
        config: {
            //  auth: false,
            description: 'Get draftOrder',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);

                const res = await mongo.collection('orders').find().toArray();
                let orderNo;
                // if first ORDER
                if (res.length === 0) {
                    orderNo = '0000001';
                } else {
                    // get latest order-draft
                    const resLatest = await mongo.collection('orders').find().sort({ crt: -1 }).limit(1).toArray();

                    // change string to number to + orderNO.
                    orderNo = Number(resLatest[0].orderNo) + 1;

                    // change number to string to + "0"
                    orderNo = orderNo.toString();
                    for (let i = orderNo.length; i <= 6; i++) {
                        orderNo = '0' + orderNo;
                    }

                }

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: {
                        orderNo,
                    },
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Remove orders
        method: 'DELETE',
        path: '/orders/removeAll',
        config: {
            //  auth: false,
            description: 'delete orders ',
            notes: 'delete orders',
            tags: ['api'],
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type === 'customer' || typeof userProfile.access === undefined || !userProfile.access.order.delete) { return Boom.badRequest('Access Denied!'); }

                // const del = await mongo.collection('orders').deleteOne({ _id: mongoObjectId(params.id) });
                const del = await mongo.collection('orders').remove();

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
                    id: Joi.string().length(24).required().description('order id')
                }
            }
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type === 'customer' || typeof userProfile.access === undefined || !userProfile.access.order.delete) { return Boom.badRequest('Access Denied!'); }
                const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(params.id) });
                if (!res) {
                    return Boom.badRequest('Can not find order');
                }

                const del = await mongo.collection('orders').update({ _id: mongoObjectId(params.id) }, { $set: { active: false } });

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
        path: '/orders/owner/{id}',
        config: {
            //  auth: false,
            description: 'delete orders ',
            notes: 'delete orders',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('order id')
                }
            }
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(params.id), userId: userProfile._id });
                if (!res) {
                    return Boom.badRequest('Can not find order');
                }

                const del = await mongo.collection('orders').update({ _id: mongoObjectId(params.id) }, { $set: { active: false } });

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

    // {  // PUT orders job status
    //     method: 'PUT',
    //     path: '/orders/update-job',
    //     config: {
    //         //  auth: false,
    //         description: 'Update orders ',
    //         notes: 'Update orders ',
    //         tags: ['api'],
    //         validate: {
    //             payload: {
    //                 ordersId: Joi.string().length(24).required().description('id ordersId'),
    //                 name: Joi.string().description('job name'),
    //                 status: Joi.string().description('job status'),
    //                 userId: Joi.string().length(24).optional().description('id userId'),
    //             },
    //         },
    //     },
    //     handler: async (req, reply) => {
    //         try {
    //             const mongo = Util.getDb(req);
    //             const payload = req.payload;

    //             // Check No Data
    //             const res = await mongo.collection('orders').findOne({ _id: mongoObjectId(payload.ordersId) });

    //             if (!res) {
    //                 return (Boom.badData(`Can't find ID ${payload.ordersId}`));
    //             }

    //             // Create Update Info & Update orders
    //             const updateInfo = Object.assign({}, payload);
    //             delete updateInfo.ordersId;
    //             updateInfo.mdt = Date.now();

    //             const update = await mongo.collection('orders').update({ _id: mongoObjectId(payload.ordersId), "job.name": payload.name }, { $set: { "job.$.status": payload.status } });

    //             // Create & Insert orders-Log
    //             const writeLog = await Util.writeLog(req, payload, 'orders-log', 'update-job');

    //             // Return 200
    //             return ({
    //                 massage: 'OK',
    //                 statusCode: 200,
    //             });

    //         } catch (error) {
    //             return (Boom.badGateway(error));
    //         }
    //     },

    // },
];
