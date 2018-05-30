
import * as pathSep from 'path';
const config = {
    dev: {
        mongodb: {
            url: 'mongodb://admin:123456@ds117540.mlab.com:17540/one-stop-jewelry',
            decorate: true,
            settings: {
                poolSize: 10,
            },
        },
        hapi: {
            host: 'api.adoma.codth.com', // 'api.adoma.codth.com' 'localhost:38101',
            port: '38101',
            router: { routes: 'dist/routes/*.js' }
        },
        mail: {
            DOMAIN: `mg.codth.com`,
            API_KEY: `key-b09165d35576ee942a4158800f0282af`,
        },
    },
    path: {
        upload: pathSep.join(__dirname, 'upload'),
        pdf: pathSep.join(__dirname, 'upload', 'document.pdf'),
    },
    inventory: {
        status: {
            IN_STOCK: 'In Stock',
        },
    },
    fileType: {
        images: [
            'png',
            'jpg',
            'jpeg',
        ],
        pdf: ['pdf'],
        design: ['3ds', 'iges', 'dxf', 'stl', 'ifc', 'obj', 'dwg', 'ai', 'png', 'jpg', 'jpeg'],
    },
    jwt: {
        timeout: '8h',
        refreshInterval: 30 * 60 * 1000 // 30 mins
    },
    timezone: {
        thai: 7 * 60 * 60 * 1000
    },
    regex: /[\S]+/,
};

export { config }