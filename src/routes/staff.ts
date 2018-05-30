import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import * as JWTDecode from 'jwt-decode';
import { config } from '../index';
import { Util } from '../util';

const mongoObjectId = ObjectId;

module.exports = [
    {  // Insert account profile
        method: 'POST',
        path: '/staff',
        config: {
            auth: false,
            description: 'Insert account data',
            notes: 'Insert account data',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex).required(),
                    password: Joi.string().min(1).max(100).regex(config.regex).required().description('password'),
                    type: Joi.string().valid(['admin', 'super-admin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    acl: Joi.array().description('list access control'),
                    firstname: Joi.string().min(1).max(40).regex(config.regex).required(),
                    lastname: Joi.string().min(1).max(40).regex(config.regex).required(),
                    address: Joi.string().optional().description('address'),
                    // address: Joi.object({
                    //     no: Joi.string().description('home'),
                    //     alley: Joi.string().description('alley'),
                    //     villageno: Joi.string().description('village no'),
                    //     district: Joi.string().description('district'),
                    //     subdistrict: Joi.string().description('sub district'),
                    //     province: Joi.string().description('province'),
                    //     postalcode: Joi.string().description('postal code'),
                    // }).description('address'),
                    tel: Joi.string().min(1).max(12).regex(config.regex),
                    email: Joi.string().email(),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                payload.password = Util.hash(payload.password);
                payload.active = true;
                const insert = await mongo.collection('staff').insert(payload);
                return ({
                    msg: 'OK',
                    statusCode: 200,
                });
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT staff
        method: 'PUT',
        path: '/staff',
        config: {
            auth: false,
            description: 'Update staff ',
            notes: 'Update staff ',
            tags: ['api'],
            validate: {
                payload: {
                    accountId: Joi.string().length(24).required().description('id account').required(),
                    username: Joi.string().min(1).max(20).regex(config.regex),
                    password: Joi.string().min(1).max(100).regex(config.regex).description('password'),
                    type: Joi.string().valid(['admin', 'super-admin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    acl: Joi.array().description('list access control'),
                    firstname: Joi.string().min(1).max(40).regex(config.regex),
                    lastname: Joi.string().min(1).max(40).regex(config.regex),
                    address: Joi.string().optional().description('address'),
                    // address: Joi.object({
                    //     no: Joi.string().description('home'),
                    //     alley: Joi.string().description('alley'),
                    //     villageno: Joi.string().description('village no'),
                    //     district: Joi.string().description('district'),
                    //     subdistrict: Joi.string().description('sub district'),
                    //     province: Joi.string().description('province'),
                    //     postalcode: Joi.string().description('postal code'),
                    // }).description('address'),
                    mobile: Joi.string().min(1).max(12).regex(config.regex),
                    email: Joi.string().email(),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('staff').findOne({ _id: mongoObjectId(payload.staffId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.staffId}`));
                }

                // Create Update Info & Update staff
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.staffId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('staff').update({ _id: mongoObjectId(payload.staffId) }, { $set: updateInfo });

                // Create & Insert staff-Log
                const writeLog = await Util.writeLog(req, payload, 'staff-log', 'update');

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
    {  // Select all account
        method: 'GET',
        path: '/staff/{id?}',
        config: {
            description: 'Select all account ',
            notes: 'Select all account ',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id account'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('staff').find(find).sort({ crt: -1 }).toArray();

                return ({
                    data: res,
                    msg: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Delete account
        method: 'DELETE',
        path: '/staff/{id}',
        config: {
            auth: false,
            description: 'check Master before delete account ',
            notes: 'check Master before delete account',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id account'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const del = await mongo.collection('staff').deleteOne({ _id: mongoObjectId(params.id) });

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
