const path = require('path');

const storageDriver = require('./../mockStorageDrivers/fsDriver');

function getMethodRelatedJsonHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize((resourceURLPathname || '.') + '/' + currentRequestContext.request.method + '.json')
    });

    if (!storageDriver.pathExists(fileLocation)) {
        return [];
    }

    return [{
        path: fileLocation,
        name: 'methodRelatedJsonHandler',
        nature: 'static'
    }];
}

module.exports = getMethodRelatedJsonHandler;
