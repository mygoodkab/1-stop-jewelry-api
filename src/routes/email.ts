import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { mail } from '../mail';
const mongoObjectId = ObjectId;

module.exports = [
    {  // Send mail
        method: 'POST',
        path: '/email/send',
        config: {
          //  auth: false,
            description: 'Sent email',
            notes: 'Sent email',
            tags: ['api'],
            validate: {
                payload: {
                    customerId: Joi.string().length(24).required().description('id customerId'),
                    orderNo: Joi.string().required().description('order number'),
                    link: Joi.string().required().description('link to order'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const payload = req.payload;
                const mongo = Util.getDb(req);
                payload.crt = Date.now();
                const resCustomer = await mongo.collection('customer').findOne({ _id: mongoObjectId(payload.customerId) });
                const resOrder = await mongo.collection('orders').findOne({ no: payload.orderNo, customerId: payload.customerId });

                if (!resCustomer ) {
                    return Boom.badRequest(`Invaild Customer ID`);
                }
                if (!resOrder) {
                    return Boom.badRequest(`Invaild Order number`);
                }
                

                const mailOption = {
                    from: `no-reply<no-reply@mg.codth.com>`, // sender address
                    to: `${resCustomer.email}`, // adoma@adoma-jewel-manufact.com
                    subject: `One  Stop Jewelry`, // Subject line
                    html: `Link : ${payload.link}` // html body
                }

                const sendmail = await mail(mailOption);
                const insert = await mongo.collection('mail-send').insertOne(payload);
                return ({
                    msg: 'OK',
                    statusCode: 200,
                });
            } catch (error) {
                return (Boom.badRequest(error));
            }
        },
    }
];
