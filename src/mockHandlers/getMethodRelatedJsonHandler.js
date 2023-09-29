const fs = require('fs');
const path = require('path');

const chalk = require('chalk').default;

const asStaticFile = require('./../mockLoaders/asStaticFile');

function getMethodRelatedJsonHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset) {

    const fileLocation = runtimeConfig.pathTemplate({
        root: path.resolve(runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize((resourceURLPathname || '.') + '/' + currentRequestContext.request.method + '.json')
    });

    if (!fs.existsSync(fileLocation)) {
        return [];
    }

    return [{
        loader: asStaticFile(fileLocation),
        file: fileLocation,
        name: 'methodRelatedJsonHandler',
        nature: 'static'
    }];
}

module.exports = getMethodRelatedJsonHandler;
