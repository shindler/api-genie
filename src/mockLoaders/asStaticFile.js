const storageDriver = require('../mockStorageDrivers/fsDriver');

module.exports = function (path) {

    return {
        load: getStaticFileAdapter,
    };

    function getStaticFileAdapter() {
        // return object that complies with handler interface expectations
        return {
            willHandle: () => true,
            execute
        };
    }

    function execute(mockPath, currentRequestContext, options) {

        try {
            const content = storageDriver.pathRead(path);
            const resp = {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': content.length
                },
                body: content
            };

            if (options && options.hasOwnProperty('headers')) {
                Object.assign(resp.headers, options.headers);
            }

            currentRequestContext.response.writeHead((options && options.hasOwnProperty('statusCode')) ? options.statusCode : 200, resp.headers);
            currentRequestContext.response.end(resp.body);

        } catch (e) {
            signalFailure(currentRequestContext, `404 | Mock file not found ${path}`);

            return;
        }
    }
}
