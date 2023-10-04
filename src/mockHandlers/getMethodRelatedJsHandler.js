const path = require('path');

const storageDriver = require('./../mockStorageDrivers/fsDriver');

function getMethodRelatedJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize((resourceURLPathname || '.') + '/' + currentRequestContext.request.method + '.js')
    });

    if (!storageDriver.pathExists(fileLocation)) {
        return [];
    }

    return [{
        path: fileLocation,
        name: 'methodRelatedJsHandler',
        nature: 'dynamic'
    }];
}

module.exports = getMethodRelatedJsHandler;
