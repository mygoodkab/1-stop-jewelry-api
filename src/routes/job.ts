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
                const find: any = { active: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('job').find(find).toArray();
                // for (const index in res) {
                //     for (const key in res[index].field) {
                //         if (res[index].field[key].choice) {
                //             for (const i in res[index].field[key].choice) {
                //                 res[index].field[key].choice = await mongo.collection('choice').find({ _id: mongoObjectId(res[index].field[key].choice[i]) }).toArray();
                //             }

                //         }
                //     }
                // }

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
                query: {
                    name: Joi.string().required().description('name job'),
                    /*
                     example field [{'remark':'xxxxxx','choice':['name-xxx']},
                                    {'item','10'}]
                    */
                    field: Joi.array().items().description('field in job'),
                    // field: Joi.array().items({
                    //     name: Joi.string().required().description('name field'),
                    //     type: Joi.string().valid(['img', 'num', 'text', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'perious']).required().description('field type => img, text, dropdown, checkbox, radio, date, time, perious'),
                    //     choice: Joi.string().description('type of choice')
                    // }).required(),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.query;

                payload.crt = Date.now();
                payload.active = true;

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
                    name: Joi.string().description('name job'),
                    /*
                example field [{'remark':'xxxxxx'},
                               {'item','10'}]
               */
                    field: Joi.array().items(Joi.object()).description('field in job'),
                    // field: Joi.array().items({
                    //     name: Joi.string().description('name field'),
                    //     type: Joi.string().valid(['img', 'text', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'perious']).description('field type => img, text, dropdown, checkbox, radio, date, time, perious'),
                    //     choice: Joi.string().description('choice of data')
                    // }),
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
];
