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
        path: '/accounts',
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
                    address: Joi.object({
                        no: Joi.string().min(1).max(10).regex(config.regex).required(),
                        road: Joi.string().min(1).max(40).regex(config.regex).required(),
                        province: Joi.string().min(1).max(40).regex(config.regex).required(),
                        district: Joi.string().min(1).max(40).regex(config.regex).required(),
                        zipcode: Joi.string().min(1).max(10).regex(config.regex).required(),
                    }),
                    mobile: Joi.string().min(1).max(12).regex(config.regex),
                    email: Joi.string().email(),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                // วันเวลาที่สร้าง
                payload.password = Util.hash(payload.password);
                // สถานะการใช้งาน
                payload.isUse = true;
                const insert = await mongo.collection('accounts').insert(payload);
                return ({
                    msg: 'OK',
                    statusCode: 200,
                });
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT accounts
        method: 'PUT',
        path: '/accounts',
        config: {
            auth: false,
            description: 'Update accounts ',
            notes: 'Update accounts ',
            tags: ['api'],
            validate: {
                payload: {
                    accountId: Joi.string().length(24).optional().description('id account').required(),
                    username: Joi.string().min(1).max(20).regex(config.regex),
                    password: Joi.string().min(1).max(100).regex(config.regex).description('password'),
                    type: Joi.string().valid(['admin', 'super-admin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    acl: Joi.array().description('list access control'),
                    firstname: Joi.string().min(1).max(40).regex(config.regex),
                    lastname: Joi.string().min(1).max(40).regex(config.regex),
                    address: Joi.object({
                        no: Joi.string().min(1).max(10).regex(config.regex),
                        road: Joi.string().min(1).max(40).regex(config.regex),
                        province: Joi.string().min(1).max(40).regex(config.regex),
                        district: Joi.string().min(1).max(40).regex(config.regex),
                        zipcode: Joi.string().min(1).max(10).regex(config.regex),
                    }),
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
                const res = await mongo.collection('accounts').findOne({ _id: mongoObjectId(payload.accountsId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.accountsId}`));
                }

                // Create Update Info & Update accounts
                const updateInfo = Object.assign('', payload);
                delete updateInfo.accountsId;
                updateInfo.mdt = Date.now();

                const update = await mongo.collection('accounts').update({ _id: mongoObjectId(payload.accountsId) }, { $set: updateInfo });

                // Create & Insert accounts-Log
                const writeLog = await Util.writeLog(req, payload, 'accounts-log', 'update');

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
        path: '/accounts/{id?}',
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
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('accounts').find(find).toArray();

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
    {  // Login
        method: 'POST',
        path: '/login',
        config: {
            auth: false,
            description: 'Check login',
            notes: 'Check login',
            tags: ['api'],
            validate: {
                payload: {
                    password: Joi.string().min(1).max(100).regex(config.regex).required().description('password'),
                    username: Joi.string().min(1).max(20).regex(config.regex).required(),
                },
            },
        },
        handler: async (req, reply) => {
            const mongo = Util.getDb(req);
            const payload = req.payload;
            payload.password = Util.hash(payload.password);
            try {
                const login = await mongo.collection('accounts').findOne({ username: payload.username, password: payload.password, isUse: true });
                if (login) {
                    delete login.password;
                    login.ts = Date.now();
                    login.refresh = Util.hash(login);
                    const token = JWT.sign(login, Util.jwtKey(), { expiresIn: config.jwt.timeout });
                    const insert = await mongo.collection('token').insertOne({ token, refresh: login.refresh, method: 'login' });
                    return ({
                        data: token,
                        message: 'Login success',
                        statusCode: 200,
                    });
                } else {
                    return (Boom.notFound('Invaild username or password'));
                }
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },
    },
    {  // Refresh Token
        method: 'POST',
        path: '/token',
        config: {
            auth: false,
            description: 'Refresh Token',
            notes: 'Refresh Token',
            tags: ['api'],
            validate: {
                payload: {
                    refresh: Joi.string().required().description('refresh token code'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const res = await mongo.collection('token').findOne({ refresh: payload.refresh });
                if (!res) { return Boom.badRequest('Can not find an authenticated refresh token'); }

                // Decode JWT to get EXP
                const token = JWTDecode(res.token);

                // Check EXP is Timeout/Time to refresh
                if (!Util.isRefreshAvailable(token.exp)) { return Boom.badRequest('Token was TIME OUT/NOT TIME TO REFRESH'); }

                // Create new refresh code
                res.refresh = Util.hash(res);
                const newToken = JWT.sign(res, Util.jwtKey(), { expiresIn: config.jwt.timeout });
                const insert = await mongo.collection('token').insert({ token, refresh: res.refresh, method: 'refresh' });

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: newToken,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // Delete account
        method: 'DELETE',
        path: '/accounts/{id}',
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
                const del = await mongo.collection('accounts').deleteOne({ _id: mongoObjectId(params.id) });

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
