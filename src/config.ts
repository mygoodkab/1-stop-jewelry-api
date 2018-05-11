
import * as pathSep from 'path';
module.exports = {
    dev: {
        mongodb: {
            url: 'mongodb://admin:123456@ds117540.mlab.com:17540/one-stop-jewelry',
            decorate: true,
            settings: {
                poolSize: 10,
            },
        },
        path: {
            upload: pathSep.join(__dirname, 'upload'),
            pdf: pathSep.join(__dirname, 'upload', 'document.pdf'),
        },
        hapi: {
            port: '3000',
            router: { routes: 'dist/routes/*.js' }
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
        },
        jwt: {
            timeout: '8h',
            refreshInterval: 30 * 60 * 1000 // 30 mins
        },
        timezone: {
            thai: 7 * 60 * 60 * 1000
        },
        regex: /[\S]+/,
        vat: 7,
    }
};
