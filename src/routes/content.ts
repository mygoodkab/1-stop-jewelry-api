import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET content
        method: 'GET',
        path: '/content/{id?}',
        config: {
            auth: false,
            description: 'Get content',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id content'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('content').find(find).sort({ crt: -1 }).toArray();

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
    {  // POST content
        method: 'POST',
        path: '/content',
        config: {
            auth: false,
            description: 'Insert content ',
            notes: 'Insert content ',
            tags: ['api'],
            validate: {
                payload: {
                    eng: Joi.object({
                        title: Joi.string().description('Eng title'),
                    }).description('Eng'),
                    th: Joi.object({
                        title: Joi.string().description('TH title'),
                    })
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                payload.crt = Date.now();

                const insert = await mongo.collection('content').insertOne(payload);

                // Create & Insert content-Log
                const log = Object.assign({}, payload);
                log.customerId = insert.insertedId.toString();
                const writeLog = await Util.writeLog(req, log, 'content-log');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT content
        method: 'PUT',
        path: '/content/{id}',
        config: {
            // auth: false,
            description: 'Update content ',
            notes: 'Update content ',
            tags: ['api'],
            validate: {
                payload: {
                    eng: Joi.object({
                        title: Joi.string().description('Eng title'),
                    }).description('Eng'),
                    th: Joi.object({
                        title: Joi.string().description('TH title'),
                    }).description('Thai'),
                },
                query: {
                    id: Joi.string().length(24).required().description('id content'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const query = req.query;
                const userProfile = jwtDecode(req.headers.authorization);
               // if (typeof userProfile.access === 'undefined' || !userProfile.access.content.update) { return Boom.badRequest('Access Denied!'); }

                // Check No Data
                const res = await mongo.collection('content').findOne({ _id: mongoObjectId(query.id) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.customerId}`));
                }

                // Create Update Info & Update content
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.customerId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('content').update({ _id: mongoObjectId(payload.customerId) }, { $set: updateInfo });

                // Create & Insert content-Log
                const writeLog = await Util.writeLog(req, payload, 'content-log');

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
    {  // Remove content
        method: 'DELETE',
        path: '/content/{id}',
        config: {
            // auth: false,
            description: 'delete content ',
            notes: 'delete content',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id content'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                if (typeof userProfile.access === 'undefined' || !userProfile.access.content.delete) { return Boom.badRequest('Access Denied!'); }
                const del = await mongo.collection('content').deleteOne({ _id: mongoObjectId(params.id) });

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
