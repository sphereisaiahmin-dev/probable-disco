const serverless = require('serverless-http');
const app = require('../../server');

let handler;

function getHandler() {
    if (!handler) {
        handler = serverless(app, {
            request: (request, event, context) => {
                request.serverless = { event, context };
            }
        });
    }
    return handler;
}

exports.handler = async (event, context) => {
    const lambdaHandler = getHandler();
    return lambdaHandler(event, context);
};
