import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET choice
        method: 'GET',
        path: '/choice/{id?}',
        config: {
            auth: false,
            description: 'Get choice',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id choice'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('choice').find(find).toArray();

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
    {  // POST choice
        method: 'POST',
        path: '/choice',
        config: {
            auth: false,
            description: 'Insert choice ',
            notes: 'Insert choice ',
            tags: ['api'],
            validate: {
                payload: {
                    choiceId: Joi.string().length(24).optional().description('id taskId'), taskId: Joi.string().length(24).optional().description('id choiceId'),
                    choice: Joi.array().items().description('choice choice'),
                    type: Joi.string().description('choice type'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                payload.crt = Date.now();
                payload.isUse = true;

                const insert = await mongo.collection('choice').insertOne(payload);

                // Create & Insert choice-Log
                const log = Object.assign({}, payload);
                log.choiceId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'choice-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT choice
        method: 'PUT',
        path: '/choice',
        config: {
            auth: false,
            description: 'Update choice ',
            notes: 'Update choice ',
            tags: ['api'],
            validate: {
                payload: {
                    choice: Joi.array().items().description('choice choice'),
                    type: Joi.string().description('choice type'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('choice').findOne({ _id: mongoObjectId(payload.choiceId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.choiceId}`));
                }

                // Create Update Info & Update choice
                const updateInfo = Object.assign('', payload);
                delete updateInfo.choiceId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('choice').update({ _id: mongoObjectId(payload.choiceId) }, { $set: updateInfo });

                // Create & Insert choice-Log
                const writeLog = await Util.writeLog(req, payload, 'choice-log', 'update');

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
    {  // Delete choice
        method: 'DELETE',
        path: '/choice/{id}',
        config: {
            auth: false,
            description: 'delete choice ',
            notes: 'delete choice',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id choice'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('choice').deleteOne({ _id: mongoObjectId(params.id) });

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
