import * as  Boom from 'boom';
import * as Joi from 'joi';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as pathSep from 'path';
import * as fs from 'fs';
import { upload } from '../upload';
import { config } from '../config';
import * as jwtDecode from 'jwt-decode';
const mongoObjectId = ObjectId;
module.exports = [
    {  // Upload Image
        method: 'POST',
        path: '/file/image',
        config: {
            //  auth: false,
            tags: ['api'],
            description: 'Upload file',
            notes: 'Upload file',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('upload file image'),
                }
            },
            payload: {
                maxBytes: 5000000,
                parse: true,
                output: 'stream',
                allow: 'multipart/form-data',
            },
        },
        handler: async (req, reply) => {

            try {
                const payload = req.payload;
                const mongo = Util.getDb(req);
                const userProfile = jwtDecode(req.headers.authorization);
                // If folder is not exist and Create Floder
                if (!Util.existFolder(config.path.upload)) {
                    if (Util.mkdirFolder(config.path.upload)) {
                        throw new Error('False to create upload folder');
                    }
                }

                const path = config.path.upload;
                const fileDetail: any = await upload(payload.file, path, config.fileType.images);
                fileDetail.userId = userProfile._id;
                const insert = await mongo.collection('images').insertOne(fileDetail);

                return {
                    statusCode: 200,
                    massage: 'OK',
                    data: fileDetail,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        }
    },
    {  // Get image file
        method: 'GET',
        path: '/file/image/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id image'),
                },
            },
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request);
            try {
                const resUpload = await mongo.collection('images').findOne({ _id: mongoObjectId(request.params.id) });

                if (!resUpload) {
                    return Boom.badRequest('can not find file!');
                } else {
                    const path: any = pathSep.join(config.path.upload, resUpload.storeName);
                    return reply.file(path,
                        {
                            filename: resUpload.orignalName + '.' + resUpload.fileType,
                            mode: 'inline'
                        });
                }
            } catch (error) {
                reply(Boom.badGateway(error));
            }
        },
    },
    {  // Get image file data
        method: 'GET',
        path: '/file/image/data/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().optional().description('id image'),
                },
            },
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request);
            try {
                const params = request.params
                const find: any = {}
                if (params.id === '{id}') { delete params.id }
                if (params.id) { find._id = mongoObjectId(params.id) }
                const resUpload = await mongo.collection('images').find(find).toArray();

                if (!resUpload) {
                    return Boom.badRequest('can not find file!');
                } else {

                    return {
                        statusCode: 200,
                        message: 'OK',
                        data: resUpload,
                    }
                }
            } catch (error) {
                reply(Boom.badGateway(error));
            }
        },
    },
    {  // Upload Design file
        method: 'POST',
        path: '/file/design',
        config: {
            //   auth: false,
            tags: ['api'],
            description: 'Upload file design',
            notes: 'Upload file design',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('upload file image'),
                }
            },
            payload: {
                maxBytes: 500000000,
                parse: true,
                output: 'stream',
                allow: 'multipart/form-data',
            },
        },
        handler: async (req, reply) => {

            try {
                const payload = req.payload;
                const mongo = Util.getDb(req);
                const userProfile = jwtDecode(req.headers.authorization);
                // If folder is not exist and Create Floder
                if (!Util.existFolder(config.path.upload)) {
                    if (Util.mkdirFolder(config.path.upload)) {
                        throw new Error('False to create upload folder');
                    }
                }

                const path = config.path.upload;
                const fileDetail: any = await upload(payload.file, path, config.fileType.design);
                fileDetail.userId = userProfile._id;
                const insert = await mongo.collection('design').insertOne(fileDetail);

                return {
                    statusCode: 200,
                    massage: 'OK',
                    data: fileDetail,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        }
    },
    {  // Get Design file
        method: 'GET',
        path: '/file/design/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id file'),
                },
            },
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request);
            try {
                const resfile = await mongo.collection('design').findOne({ _id: mongoObjectId(request.params.id) })
                if (!resfile) {
                    return Boom.badRequest('can not find file!')
                }

                return reply.file(pathSep.join(config.path.upload, resfile.storeName))
                    .header(`Content-Disposition`, `attachment; filename=${resfile.orignalName}.${resfile.fileType}`)
            } catch (error) {
                reply(Boom.badGateway(error));
            }
        },
    },
    {  // Get image file data
        method: 'GET',
        path: '/file/design/data/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().optional().description('id design'),
                },
            },
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request);
            try {
                const params = request.params
                const find: any = {}
                if (params.id === '{id}') { delete params.id }
                if (params.id) { find._id = mongoObjectId(params.id) }
                const resUpload = await mongo.collection('design').find(find).toArray();

                if (!resUpload) {
                    return Boom.badRequest('can not find file!');
                } else {

                    return {
                        statusCode: 200,
                        message: 'OK',
                        data: resUpload,
                    }
                }
            } catch (error) {
                reply(Boom.badGateway(error));
            }
        },
    },
    {  // remove image
        method: 'DELETE',
        path: '/file/image/{id}',
        config: {
            auth: false,
            description: 'delete iamge ',
            notes: 'delete images',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id images'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                const find: any = { _id: mongoObjectId(params.id) }
                if (userProfile.type === 'customer') {
                    find.userId = userProfile._id
                }

                const res = await mongo.collection('images').findOne(find);

                if (!res) {
                    return Boom.badRequest('can not find file!')
                }

                if (Util.unlinkFile(pathSep.join(config.path.upload, res.storeName))) {
                    return Boom.badGateway('Can not unlinkfile');
                }
                const del = await mongo.collection('images').deleteOne({ _id: mongoObjectId(params.id) });

                // Return 200
                return reply.response({
                    massage: 'OK',
                    statusCode: 200,
                }).code(200);

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // remove Design file
        method: 'DELETE',
        path: '/file/design/{id}',
        config: {
            auth: false,
            description: 'delete design file ',
            notes: 'delete design file',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id design file'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const userProfile = jwtDecode(req.headers.authorization);
                const find: any = { _id: mongoObjectId(params.id) }
                if (userProfile.type === 'customer') {
                    find.userId = userProfile._id
                }

                const res = await mongo.collection('design').findOne(find);

                if (!res) {
                    return Boom.badRequest('can not find file!')
                }

                if (Util.unlinkFile(pathSep.join(config.path.upload, res.storeName))) {
                    return Boom.badGateway('Can not unlinkfile');
                }
                const del = await mongo.collection('design').deleteOne({ _id: mongoObjectId(params.id) });

                // Return 200
                return reply.response({
                    massage: 'OK',
                    statusCode: 200,
                }).code(200);

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
];
