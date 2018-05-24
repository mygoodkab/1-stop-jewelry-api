import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../index';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET latest draft-order
        method: 'GET',
        path: '/draft-order/latest',
        config: {
            auth: false,
            description: 'Get draft-order',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);

                const res = await mongo.collection('draft-order').find().toArray();
                let insert;
                let orderNo;
                // if first ORDER
                if (res.length == 0) {
                    orderNo = "0010000"
                    insert = await mongo.collection('draft-order').insertOne({ no: orderNo });
                } else {
                    // get latest order-draft 
                    const resLatest = await mongo.collection('draft-order').find().sort({ ts: -1 }).limit(1).toArray();
                    // change string to number to + orderNO.
                    orderNo = Number(resLatest[0].no) + 1;

                    // change number to string to + "0"
                    orderNo = orderNo.toString();

                    for (let i = orderNo.length; i <= 6; i++) {
                        orderNo = "0" + orderNo
                    }
                    const payload = {
                        no: orderNo,
                        ts: Date.now(),
                    }
                    insert = await mongo.collection('draft-order').insertOne(payload)

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
    {  // GET draft-order
        method: 'GET',
        path: '/draft-order',
        config: {
            auth: false,
            description: 'Get draft-order',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);

                const res = await mongo.collection('draft-order').find().toArray();

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
    {  // PUT draft-order
        method: 'PUT',
        path: '/draft-order',
        config: {
            auth: false,
            description: 'Update draft-order ',
            notes: 'Update draft-order ',
            tags: ['api'],
            validate: {
                query: {
                    draftOrderId: Joi.string().length(24).optional().required().description('id draft-orderId'),
                    customerId: Joi.string().length(24).optional().required().description('id customerId'),
                    job: Joi.array().items().description('job detail'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.query;

                // Check No Data
                const res = await mongo.collection('draft-order').findOne({ _id: mongoObjectId(payload.orderId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.orderId}`));
                }

                // Create Update Info & Update draft-order
                const updateInfo = Object.assign('', payload);
                delete updateInfo.orderId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('draft-order').update({ _id: mongoObjectId(payload.orderId) }, { $set: updateInfo });

                // Create & Insert draft-order-Log
                const writeLog = await Util.writeLog(req, payload, 'draft-order-log', 'update');

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
        path: '/draft-order',
        config: {
            auth: false,
            description: 'delete choice ',
            notes: 'delete choice',
            tags: ['api'],
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const del = await mongo.collection('draft-order').remove();

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
