import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET latest draftOrder
        method: 'GET',
        path: '/draftOrder/latest',
        config: {
            auth: false,
            description: 'Get draftOrder',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);

                const res = await mongo.collection('draftOrder').find().toArray();
                let insert;
                let orderNo;
                // if first ORDER
                if (res.length == 0) {
                    orderNo = "0000001"
                    insert = await mongo.collection('draftOrder').insertOne({ no: orderNo });
                } else {
                    // get latest order-draft 
                    const resLatest = await mongo.collection('draftOrder').find().sort({ ts: -1 }).limit(1).toArray();
                    // change string to number to + orderNO.
                    orderNo = Number(resLatest[0].no) + 1;

                    // change number to string to + "0"
                    orderNo = orderNo.toString();

                    for (let i = orderNo.length; i <= 6; i++) {
                        orderNo = "0" + orderNo
                    }
                    const payload = {
                        no: orderNo,
                        crt: Date.now(),
                    }
                    insert = await mongo.collection('draftOrder').insertOne(payload)

                }

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: {
                        orderNo: orderNo,
                        draftOrderId: insert.insertedId
                    },
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
            auth: false,
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

                const res = await mongo.collection('draftOrder').find(find).sort({ crt: -1 }).toArray();
                for (const key in res) {
                    delete res[key]._id
                    delete res[key].ts
                    delete res[key].mdt
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
            auth: false,
            description: 'Update draftOrder ',
            notes: 'Update draftOrder ',
            tags: ['api'],
            validate: {
                payload: {
                    draftOrderId: Joi.string().length(24).required().description('id draftOrderId'),
                    no: Joi.string().required().description('order number'),
                    customerId: Joi.string().length(24).optional().description('id customerId'),
                    job: Joi.array().items(Joi.object()).description('job detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('draftOrder').findOne({ _id: mongoObjectId(payload.draftOrderId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.draftOrderId}`));
                }

                // Create Update Info & Update draftOrder
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.draftOrderId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('draftOrder').update({ _id: mongoObjectId(payload.draftOrderId) }, { $set: updateInfo });
                const payloadLog = Object.assign({}, payload);
                // Create & Insert draftOrder-Log
                const writeLog = await Util.writeLog(req, payloadLog, 'draftOrder-log', 'update');

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                    data: payload,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Delete choice
        method: 'DELETE',
        path: '/draftOrder',
        config: {
            auth: false,
            description: 'delete choice ',
            notes: 'delete choice',
            tags: ['api'],
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
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
