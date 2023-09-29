const fs = require('fs');
const path = require('path');

const chalk = require('chalk').default;

const asNodeModule = require('./../mockLoaders/asNodeModule');

function getTopMostFolderIndexJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: runtimeConfig.mockIndexFilename
    });

    if (!fs.existsSync(fileLocation)) {
        return [];
    }

    return [{
        loader: asNodeModule(fileLocation),
        file: fileLocation,
        name: 'topMostFolderIndexJsHandler',
        nature: 'dynamic'
    }];

}

module.exports = getTopMostFolderIndexJsHandler;
