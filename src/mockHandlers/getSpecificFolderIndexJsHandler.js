const path = require('path');

const storageDriver = require('./../mockStorageDrivers/fsDriver');

function getSpecificFolderIndexJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize((resourceURLPathname || '.') + '/' + runtimeConfig.mockIndexFilename)
    });

    if (!storageDriver.pathExists(fileLocation)) {
        return [];
    }

    return [{
        path: fileLocation,
        name: 'specificFolderIndexJsHandler',
        nature: 'dynamic'
    }];
}

module.exports = getSpecificFolderIndexJsHandler;
