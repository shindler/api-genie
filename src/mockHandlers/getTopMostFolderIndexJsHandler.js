const path = require('path');


const storageDriver = require('./../mockStorageDrivers/fsDriver');

function getTopMostFolderIndexJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: runtimeConfig.mockIndexFilename
    });

    if (!storageDriver.pathExists(fileLocation)) {
        return [];
    }

    return [{
        path: fileLocation,
        name: 'topMostFolderIndexJsHandler',
        nature: 'dynamic'
    }];

}

module.exports = getTopMostFolderIndexJsHandler;
