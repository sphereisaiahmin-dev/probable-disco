const serverless = require('serverless-http');
const app = require('../../server');

const binaryMimeTypes = [
    'image/apng',
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/x-icon',
    'image/svg+xml',
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/octet-stream'
];

let handler;

function getHandler() {
    if (!handler) {
        handler = serverless(app, {
            request: (request, event, context) => {
                request.serverless = { event, context };
            },
            binary: binaryMimeTypes
        });
    }
    return handler;
}

exports.handler = async (event, context) => {
    const lambdaHandler = getHandler();
    return lambdaHandler(event, context);
};
