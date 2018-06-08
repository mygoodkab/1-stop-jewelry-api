import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET latest Order Number
        method: 'GET',
        path: '/draftOrder/latest',
        config: {
            //  auth: false,
            description: 'Get draftOrder',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const userProfile = jwtDecode(req.headers.authorization);

                const res = await mongo.collection('draftOrder').find({ userId: userProfile._id }).sort({ crt: -1 }).limit(1).toArray();
                if (!res[0]) {
                    res[0] = {
                        active: false
                    };
                } else {
                    res[0].draftOrderId = res[0]._id;
                    delete res[0]._id;
                    delete res[0].crt;
                }

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: res[0]
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // GET draftOrder
        method: 'GET',
        path: '/draftOrder/{id}',
        config: {
            // auth: false,
            description: 'Get draftOrder',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id draftOrder'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = {};
                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }
                const userProfile = jwtDecode(req.headers.authorization);

                if (userProfile.type === 'customer') {
                    find.userId = userProfile._id;
                }

                const res = await mongo.collection('draftOrder').find(find).sort({ crt: -1 }).toArray();
                for (const key in res) {
                    res[key].draftOrderId = res[key]._id;
                    delete res[key]._id;
                    delete res[key].crt;
                    delete res[key].active;
                }

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
    {  // PUT draftOrder
        method: 'PUT',
        path: '/draftOrder',
        config: {
            //  auth: false,
            description: 'Update draftOrder ',
            notes: 'Update draftOrder ',
            tags: ['api'],
            validate: {
                payload: {
                    draftOrderId: Joi.string().length(24).required().description('id draft order'),
                    userId: Joi.string().length(24).required().description('id user'),
                    job: Joi.array().items(Joi.object()).description('Job Order')
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // get profile from token
                const userProfile = jwtDecode(req.headers.authorization);

                // check access
                if (userProfile.type === 'customer') {
                    if (payload.userId !== userProfile._id) {
                        return Boom.badRequest('Access Denied');
                    }
                }

                // Check No Data
                const res = await mongo.collection('draftOrder').findOne({ _id: mongoObjectId(payload.draftOrderId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.draftOrderId}`));
                }

                // Create Update Info & Update draftOrder
                const updateInfo = Object.assign({}, payload);

                delete updateInfo.draftOrderId;
                // updateInfo.mdt = Date.now();

                const update = await mongo.collection('draftOrder').update({ _id: mongoObjectId(payload.draftOrderId) }, { $set: { job: updateInfo.job } });

                // return data to put again
                const resdrafOrder = await mongo.collection('draftOrder').findOne({ _id: mongoObjectId(payload.draftOrderId) });
                // const data = {
                //     draftOrderId: resdrafOrder._id,
                // }
                // delete resdrafOrder._id;
                // delete resdrafOrder.active;

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                    data: {
                        draftOrderId: resdrafOrder._id,
                        userId: resdrafOrder.userId,
                        job: resdrafOrder.job
                    },
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // POST draftOrder
        method: 'POST',
        path: '/draftOrder',
        config: {
            //  auth: false,
            description: 'Insert draftOrder order ',
            notes: 'Insert draftOrder order ',
            tags: ['api'],
            validate: {
                payload: {
                    job: Joi.array().items(Joi.object()).description('order  description'),
                }
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                // get profile from token
                const userProfile = jwtDecode(req.headers.authorization);
                payload.userId = userProfile._id;
                payload.crt = Date.now();
                payload.active = true;

                const insert = await mongo.collection('draftOrder').insertOne(payload);

                return ({
                    massage: 'OK',
                    statusCode: 200,
                    data: {
                        draftOrderId: insert.insertedId,
                        userId: payload.userId,
                        job: payload.job
                    }
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Remove draftOrder
        method: 'DELETE',
        path: '/draftOrder/removeAll',
        config: {
            // auth: false,
            description: 'delete draftOrder ',
            notes: 'delete draftOrder',
            tags: ['api'],
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const userProfile = jwtDecode(req.headers.authorization);
                // check permission
                if (userProfile.type !== 'admin' && userProfile.type !== 'superadmin') {
                    return Boom.badRequest('Permission Denied');
                }
                const del = await mongo.collection('draftOrder').remove();
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
