var fs = require('fs');
var _ = require('lodash');
const signalFailure = require('../tryToHandle');

module.exports = function (location) {
    return {
        load: getStaticFileAdapter,
    };

    function getStaticFileAdapter() {
        // return object that complies with handler interface expectations
        return {
            willHandle: () => true,
            execute: handleUsingStaticFile
        };
    }

    function handleUsingStaticFile(mockPath, currentRequestContext, options) {

        try {
            const content = fs.readFileSync(location, { encoding: 'utf8', flag: 'r' });
            const resp = {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': content.length
                },
                body: content
            };

            if (options && options.hasOwnProperty('headers')) {
                _.assign(resp.headers, options.headers);
            }

            currentRequestContext.response.writeHead((options && options.hasOwnProperty('statusCode')) ? options.statusCode : 200, resp.headers);
            currentRequestContext.response.end(resp.body);

        } catch (e) {
            signalFailure(currentRequestContext, '404 | Mock file not found');
            return
        }
    }
}
