import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import * as JWTDecode from 'jwt-decode';
import { config } from '../config';
import { Util } from '../util';
import { access } from '../access';
import { request } from 'https';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET all staff
        method: 'GET',
        path: '/staff/{id?}',
        config: {
            auth: false,
            description: 'Select all staff ',
            notes: 'Select all staff ',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id staff'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { active: true, };
                const userprofile = jwtDecode(req.headers.authorization);

                // check acces control
                if (typeof userprofile.access === undefined || typeof userprofile.access.staff === undefined || !userprofile.access.staff.read) {
                    return Boom.badRequest('Access Denied');
                }

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
    {  // GET access
        method: 'GET',
        path: '/staff/access',
        config: {
            auth: false,
            description: 'get access ',
            notes: 'get access ',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const userprofile = jwtDecode(req.headers.authorization);
                // check acces control
                if (typeof userprofile.access === undefined || typeof userprofile.access.staff === undefined || !userprofile.access.staff.create) {
                    return Boom.badRequest('Access Denied');
                }

                return ({
                    access,
                    msg: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // GET staff profile
        method: 'GET',
        path: '/staff/profile',
        config: {
            auth: false,
            description: 'Select Profile ',
            notes: 'Select Profile ',
            tags: ['api'],
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userprofile = jwtDecode(req.headers.authorization);
                const res = await mongo.collection('staff').find({ _id: mongoObjectId(userprofile._id) }).toArray();

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
    {  // POST staff
        method: 'POST',
        path: '/staff',
        config: {
            //  auth: false,
            description: 'Insert staff data',
            notes: 'Insert staff data',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex).required(),
                    password: Joi.string().min(1).max(100).regex(config.regex).required().description('password'),
                    type: Joi.string().valid(['admin', 'superadmin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    access: Joi.object().description('list access control'),
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
                    tel: Joi.string().min(1).max(12).regex(config.regex),
                    email: Joi.string().email(),
                },
            },
        },
        handler: async (req, reply) => {
            try {

                const mongo = Util.getDb(req);
                const payload = req.payload;
                const userprofile = jwtDecode(req.headers.authorization);

                // check acces control
                if (typeof userprofile.access === 'undefined' || typeof userprofile.access.staff === undefined || !userprofile.access.staff.create) {
                    return Boom.badRequest('Access Denied');
                }

                payload.password = Util.hash(payload.password);
                payload.active = true;

                // check exist user
                const res = await mongo.collection('staff').findOne({ username: payload.username });
                if (res) { return Boom.badRequest('user is exist.'); }

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
        path: '/staff/{id}',
        config: {
            //  auth: false,
            description: 'Update staff ',
            notes: 'Update staff ',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex),
                    password: Joi.string().min(1).max(100).regex(config.regex).description('password'),
                    type: Joi.string().valid(['admin', 'super-admin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    access: Joi.object().description('list access control'),
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
                query: {
                    id: Joi.string().length(24).required().description('id staff').required(),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                const query = req.query;
                const userprofile = jwtDecode(req.headers.authorization);

                // check acces control
                if (typeof userprofile.access === 'undefined' || typeof userprofile.access.staff === undefined || !userprofile.access.staff.update) {
                    return Boom.badRequest('Access Denied');
                }
                if (payload.password) { payload.password = Util.hash(payload.password); }
                // Check No Data
                const res = await mongo.collection('staff').findOne({ _id: mongoObjectId(query.id) });

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
    {  // PUT staff profile
        method: 'PUT',
        path: '/staff/profile',
        config: {
            //  auth: false,
            description: 'Update Profile ',
            notes: 'Update Profile ',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(config.regex),
                    password: Joi.string().min(1).max(100).regex(config.regex).description('password'),
                    type: Joi.string().valid(['admin', 'super-admin', 'user']),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    access: Joi.object().description('list access control'),
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
                const userprofile = jwtDecode(req.headers.authorization);

                if (payload.password) { payload.password = Util.hash(payload.password); }
                // Create Update Info & Update staff
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.staffId;
                updateInfo.mdt = Date.now();
                const update = await mongo.collection('staff').update({ _id: mongoObjectId(userprofile._id) }, { $set: updateInfo });

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
    {  // Delete staff
        method: 'DELETE',
        path: '/staff/{id}',
        config: {
            //  auth: false,
            description: 'delete staff',
            notes: 'delete staff',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id staff'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userprofile = jwtDecode(req.headers.authorization);

                // check acces control
                if (typeof userprofile.access === 'undefined' || typeof userprofile.access.staff === undefined || !userprofile.access.staff.delete) {
                    return Boom.badRequest('Access Denied');
                }

                const del = await mongo.collection('staff').update({ _id: mongoObjectId(params.id) }, { $set: { active: false } });

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
    {  // Remove staff
        method: 'DELETE',
        path: '/staff/remove/{id}',
        config: {
            //  auth: false,
            description: 'remove staff ',
            notes: 'remove staff',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id staff'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userprofile = jwtDecode(req.headers.authorization);

                // check acces control
                if (typeof userprofile.access === 'undefined' || typeof userprofile.access.staff === undefined || !userprofile.access.staff.delete) {
                    return Boom.badRequest('Access Denied');
                }

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
