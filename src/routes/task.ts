import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET task
        method: 'GET',
        path: '/task/{id?}',
        config: {
            auth: false,
            description: 'Get task',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id task'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('task').find(find).toArray();
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
    {  // POST task
        method: 'POST',
        path: '/task',
        config: {
            auth: false,
            description: 'Insert task ',
            notes: 'Insert task ',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().required().description('name task'),
                    /*
                     example field [{'remark':'xxxxxx','choice':['name-xxx']},
                                    {'item','10'}]
                    */
                    field: Joi.array().items().description('field in task'),
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
                const payload = req.payload;

                payload.crt = Date.now();
                payload.isUse = true;

                const insert = await mongo.collection('task').insertOne(payload);

                // Create & Insert task-Log
                const log = Object.assign({}, payload);
                log.taskId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'task-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT task
        method: 'PUT',
        path: '/task',
        config: {
            auth: false,
            description: 'Update task ',
            notes: 'Update task ',
            tags: ['api'],
            validate: {
                payload: {
                    taskId: Joi.string().length(24).optional().description('id taskId'),
                    name: Joi.string().description('name task'),
                    /*
                example field [{'remark':'xxxxxx'},
                               {'item','10'}]
               */
                    field: Joi.array().items(Joi.object()).description('field in task'),
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
                const res = await mongo.collection('task').findOne({ _id: mongoObjectId(payload.taskId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.taskId}`));
                }

                // Create Update Info & Update task
                const updateInfo = Object.assign('', payload);
                delete updateInfo.taskId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('task').update({ _id: mongoObjectId(payload.taskId) }, { $set: updateInfo });

                // Create & Insert task-Log
                const writeLog = await Util.writeLog(req, payload, 'task-log', 'update');

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
    {  // Delete task
        method: 'DELETE',
        path: '/task/{id}',
        config: {
            auth: false,
            description: 'delete task ',
            notes: 'delete task',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id task'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('task').deleteOne({ _id: mongoObjectId(params.id) });

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
