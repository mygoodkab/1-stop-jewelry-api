
import * as Hapi from 'hapi';
import * as HapiAuth from 'hapi-auth-jwt2';
import * as hapiMongodb from 'hapi-mongodb';
import * as hapiRouter from 'hapi-router';
import * as hapiSwagger from 'hapi-swagger';
import * as inert from 'inert';
import * as path from 'path';
import * as vision from 'vision';
import { Util } from './util';

export const config = require('./config')[process.env.NODE_ENV || 'dev'];
const project = require('./../package');
const swaggerOptions = {
    auth: false,
    info: {
        title: '1 Stop Jewelry API',
        version: project.version,
    },
    documentationPath: '/docs',
    securityDefinitions: {
        jwt: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
        }
    },
    security: [{ jwt: [] }]
};

// create new server instance
export const server = new Hapi.Server({
    port: config.hapi.port,
    routes: {
        cors: true
    }
});

// register plugins, wrapped in async/await
const serverInit = async () => {
    try {
        await server.register([
            { plugin: HapiAuth },
            { plugin: vision },
            { plugin: inert },
            {
                plugin: hapiRouter,
                options: config.hapi.router,
            },
            {
                plugin: hapiMongodb,
                options: config.mongodb
            },
            {
                options: swaggerOptions,
                plugin: hapiSwagger,
            },

        ]);
        await server.auth.strategy('jwt', 'jwt', {
            key: Util.jwtKey(),
            validate,
            verifyOptions: { maxAge: config.jwt.timeout },
        });

        // Event 'request'
        await server.events.on('request', (request: any, event: any, tags: any) => {
            if (tags.error) {
                // tslint:disable-next-line:no-console
                console.log(`Request ${event.request} error: ${event.error ? event.error.message : 'unknown'}`);
            }
        });
        // Event 'response'
        await server.events.on('response', (request: any) => {
            console.log(`IP Address : ${request.info.remoteAddress} ${request.method.toUpperCase()} ${request.url.path} | Status code : ${request.response.statusCode} | Respond Time : ${(request.info.responded - request.info.received)} ms`);
        });

        await server.auth.default('jwt');
        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.log(err);
    }

};
serverInit();

// create validate for jwt
function validate(decoded, request, callback) {
    if (decoded) {
        return { isValid: true };
    } else {
        return { isValid: false };
    }
}
