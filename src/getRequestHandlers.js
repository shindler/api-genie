const urlParser = require('url');

const chalk = require('chalk').default;
exports.chalk = chalk;


const getTopMostFolderIndexJsHandler = require('./mockHandlers/getTopMostFolderIndexJsHandler');
const getSpecificFolderIndexJsHandler = require('./mockHandlers/getSpecificFolderIndexJsHandler');
const getMethodRelatedJsHandler = require('./mockHandlers/getMethodRelatedJsHandler');
const getMethodRelatedJsonHandler = require('./mockHandlers/getMethodRelatedJsonHandler');
const getDynamicSegmentsHandlers = require('./mockHandlers/getDynamicSegmentsHandlers');

/**
     * Setup a list of possible handlers for the request
     *
     * @param {object} current request object provided originally by connect.js
     * @return {array} array of possible handlers
     */
module.exports = function getRequestHandlers(runtimeConfig, currentRequestContext, includeSubset = false) {

    const context = currentRequestContext.request.method + ' ' + currentRequestContext.request.url;

    const resourceURLParsed = urlParser.parse(currentRequestContext.request.url);
    const resourceURLPathname = resourceURLParsed['pathname'] ? resourceURLParsed.pathname.replace(currentRequestContext.mockEntry.testRegExp, '') : '';
    const resourceURLWithinPath = currentRequestContext.request.url.split(currentRequestContext.mockEntry.path)[1];

    const possibleHandlers = [
        ...getTopMostFolderIndexJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset),
        ...getSpecificFolderIndexJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset),
        ...getMethodRelatedJsHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset),
        ...getMethodRelatedJsonHandler(runtimeConfig, resourceURLPathname, currentRequestContext, includeSubset),
        ...getDynamicSegmentsHandlers(runtimeConfig, resourceURLWithinPath, currentRequestContext, includeSubset)
    ];

    return possibleHandlers.filter((handler) => handler !== undefined);
}

