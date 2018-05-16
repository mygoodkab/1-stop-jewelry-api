import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET job
        method: 'GET',
        path: '/job/{id?}',
        config: {
            auth: false,
            description: 'Get job',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id job'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('job').find(find).toArray();

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
    {  // POST job
        method: 'POST',
        path: '/job',
        config: {
            auth: false,
            description: 'Insert job ',
            notes: 'Insert job ',
            tags: ['api'],
            validate: {
                payload: {
                    customerId: Joi.string().length(24).optional().description('id customer'),
                    task: Joi.array().items().description('job detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                payload.crt = Date.now();
                payload.isUse = true;
                payload.status = 'pending';
                for (const key in payload.task) {
                    if (payload.task[key].field) {
                            payload.task[key].field.status = 'pending';
                    }
                }
                const insert = await mongo.collection('job').insertOne(payload);

                // Create & Insert job-Log
                const log = Object.assign({}, payload);
                log.jobId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'job-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT job
        method: 'PUT',
        path: '/job',
        config: {
            auth: false,
            description: 'Update job ',
            notes: 'Update job ',
            tags: ['api'],
            validate: {
                payload: {
                    jobId: Joi.string().length(24).optional().description('id jobId'),
                    task: Joi.array().items().description('job detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('job').findOne({ _id: mongoObjectId(payload.jobId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.jobId}`));
                }

                // Create Update Info & Update job
                const updateInfo = Object.assign('', payload);
                delete updateInfo.jobId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('job').update({ _id: mongoObjectId(payload.jobId) }, { $set: updateInfo });

                // Create & Insert job-Log
                const writeLog = await Util.writeLog(req, payload, 'job-log', 'update');

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
    {  // Delete job
        method: 'DELETE',
        path: '/job/{id}',
        config: {
            auth: false,
            description: 'delete job ',
            notes: 'delete job',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id job'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('job').deleteOne({ _id: mongoObjectId(params.id) });

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
    {  // GET job filter
        method: 'GET',
        path: '/job/filter',
        config: {
            auth: false,
            description: 'Get job',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                query: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix crt'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix crt'),
                    jobId: Joi.string().length(24).optional().description('id job'),
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
                        case 'jobId':
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
                const jobLogs = await db.collection('job').find(options.query).sort(options.sort).limit(options.limit).toArray();

                return {
                    data: jobLogs,
                    message: 'OK',
                    statusCode: 200,
                };
            } catch (error) {
                return Boom.badGateway(error.message, error.data);
            }
        },

    },
];
