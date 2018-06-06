import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import * as JWTDecode from 'jwt-decode';
import { config } from '../config';
import { Util } from '../util';

const mongoObjectId = ObjectId;

module.exports = [

    {  // Login
        method: 'POST',
        path: '/login/admin',
        config: {
            auth: false,
            description: 'Check login',
            notes: 'Check login',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex).required(),
                    password: Joi.string().min(1).max(100).regex(config.regex).required().description('password'),
                },
            },
        },
        handler: async (req, reply) => {
            const mongo = Util.getDb(req);
            const payload = req.payload;
            payload.password = Util.hash(payload.password);
            try {
                const login = await mongo.collection('staff').findOne({ username: payload.username, password: payload.password });
                if (login) {
                    if (!login.active) { return Boom.badRequest('User is Denied!') }
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
    {  // Login-customer
        method: 'POST',
        path: '/login/customer',
        config: {
            auth: false,
            description: 'Check login',
            notes: 'Check login',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex).required(),
                    password: Joi.string().min(1).max(100).regex(config.regex).required().description('password'),
                },
            },
        },
        handler: async (req, reply) => {
            const mongo = Util.getDb(req);
            const payload = req.payload;
            payload.password = Util.hash(payload.password);
            try {
                const login = await mongo.collection('customer').findOne({ username: payload.username, password: payload.password, active: true });
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
];
