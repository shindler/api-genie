const path = require('path');
const chalk = require('chalk').default;

const defaultConfig = require('./defaultConfig');
const generateRuntimeConfiguration = require('./generateRuntimeConfiguration');
const connectCompatibleMiddleware = require('./connectCompatibleMiddleware');

/**
 * API Genie
 *
 * @param {object} userConfig which will be merged with defaults
 */
module.exports = function apiGenie(userConfig) {

    'use strict';

    const runtimeConfig = generateRuntimeConfiguration(defaultConfig, userConfig);

    if (runtimeConfig.beVerbose) {
        console.log(chalk.blue('API Genie has been summoned to existence!'));

        console.log('Mocks map that will be used:');
        runtimeConfig.mocksMap.forEach((mockMapping) => {
            mockMapping && console.log(
                `${mockMapping.testRegExp.toString()} -> ${path.resolve(mockMapping.rootPath || runtimeConfig.mocksRootPath, mockMapping.path)}`
            );
        });
    }

    return connectCompatibleMiddleware(runtimeConfig);

};
