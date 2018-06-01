import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET archiveOrder
        method: 'GET',
        path: '/archiveOrder/{id}',
        config: {
            // auth: false,
            description: 'Get archiveOrder',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id archiveOrder'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true };
                const userProfile = jwtDecode(req.headers.authorization);
                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }
                if (userProfile.type === 'customer') {
                    find.userId = userProfile._id
                }
                const res = await mongo.collection('archiveOrder').find(find).sort({ crt: -1 }).toArray();

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: res,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // GET archiveOrder filter
        method: 'GET',
        path: '/archiveOrder/filter',
        config: {
            // auth: false,
            description: 'Get archiveOrder',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                query: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix crt'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix crt'),
                    archiveOrderId: Joi.string().length(24).optional().description('id archiveOrder'),
                    orderNo: Joi.string().optional().description('archiveOrder number'),
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
                let options: any = { query: {}, limit: 0 };
                const decode = jwtDecode(req.headers.authorization)

                // check if account is customer, query will add userId 
                if (decode.type && decode.type === 'customer') {
                    options.query.userId = decode._id;
                }
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
                        case 'limit':
                            options.limit = payload;
                            break;
                        case 'archiveOrderId':
                            options.query._id = mongoObjectId(payload[key]);
                            break;
                        case 'userId':
                            if (decode.type === 'customer') {
                                options.query.userId = decode._id;
                            }
                            options.query.userId = payload[key];
                            break;
                        case 'userId':
                            options.query.userId = payload[key];
                            break;
                        case 'orderNo':
                            options.query.no = payload[key];
                            break;
                        default:
                            options.query[key] = payload[key];
                            break;
                    }
                }
                const archiveOrderLogs = await db.collection('archiveOrder').find(options.query).sort({ crt: -1 }).limit(options.limit).toArray();

                return {
                    data: archiveOrderLogs,
                    message: 'OK',
                    statusCode: 200,
                };
            } catch (error) {
                return Boom.badGateway(error.message, error.data);
            }
        },

    },
    {  // PUT archiveOrder
        method: 'PUT',
        path: '/archiveOrder',
        config: {
            //  auth: false,
            description: 'Update archiveOrder ',
            notes: 'Update archiveOrder ',
            tags: ['api'],
            validate: {
                payload: {
                    archiveOrderId: Joi.string().length(24).required().description('id archiveOrderId'),
                    data: Joi.object().description('Order')
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const find: any = { _id: mongoObjectId(payload.archiveOrderId) }
                const userProfile = jwtDecode(req.headers.authorization);

                if (userProfile.type = 'customer') {
                    find.userId = userProfile._id
                }
                // Check No Data
                const res = await mongo.collection('archiveOrder').findOne(find);

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.archiveOrderId}`));
                }

                // Create Update Info & Update archiveOrder
                const updateInfo = Object.assign({}, payload.data);
                delete updateInfo.archiveOrderId;
                // updateInfo.mdt = Date.now();

                const update = await mongo.collection('archiveOrder').update({ _id: mongoObjectId(payload.archiveOrderId) }, { $set: { active: false } });

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
    {  // POST archiveOrder
        method: 'POST',
        path: '/archiveOrder',
        config: {
            //  auth: false,
            description: 'Insert archiveOrder order ',
            notes: 'Insert archiveOrder order ',
            tags: ['api'],
            validate: {
                payload: {
                    data: Joi.object().description('Job Order')
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const userProfile = jwtDecode(req.headers.authorization)
                payload.userId = userProfile._id
                payload.crt = Date.now();
                payload.active = true;

                const insert = await mongo.collection('archiveOrder').insertOne(payload);

                return ({
                    massage: 'OK',
                    statusCode: 200,
                    data: { archiveOrderId: insert.insertedId }
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Remove archiveOrder
        method: 'DELETE',
        path: '/archiveOrder/remove',
        config: {
            auth: false,
            description: 'delete archiveOrder ',
            notes: 'delete archiveOrder',
            tags: ['api'],
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const del = await mongo.collection('archiveOrder').remove();
                const userProfile = jwtDecode(req.headers.authorization);
                if (userProfile.type !== 'admin' && userProfile.type !== 'superadmin') {
                    return Boom.badRequest('Permission Denied')
                }
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
    {  // Delete archiveOrder
        method: 'DELETE',
        path: '/archiveOrder/{id}',
        config: {
            //  auth: false,
            description: 'delete archiveOrder ',
            notes: 'delete archiveOrder',
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
                if (userProfile.type === 'customer') {
                    const res = await mongo.collection('archiveOrder').findOne({ _id: mongoObjectId(params.id), userId: userProfile._id })
                    if (!res) {
                        return Boom.badRequest('Can not find order')
                    }
                }

                const del = await mongo.collection('archiveOrder').update({ _id: mongoObjectId(params.id) }, { $set: { active: false } });

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
