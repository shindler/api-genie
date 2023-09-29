var chalk = require('chalk').default;
var path = require('path');
var fs = require('fs');

var getSubsetFromRequest = require('./getSubsetFromRequest');
var checkIfShouldFallbackToGlobals = require('./checkIfShouldFallbackToGlobals');
var registry = require('./registry');
const { tryToHandleUsingSubset, tryToHandleUsingGlobals } = require('./tryToHandle');

function getMockEntry(runtimeConfig, request) {
    return runtimeConfig.mocksMap.find((mockEntry) => {
        return request.url.match(mockEntry.testRegExp) !== null;
    });
}

function substituteMethodIfRequired(runtimeConfig, request) {
    if (request.headers.hasOwnProperty(runtimeConfig.methodOverwriteHeader)) {
        const originalRequestMethod = request.method;

        request.method = request.headers[runtimeConfig.methodOverwriteHeader];

        runtimeConfig.beVerbose && console.log(
            chalk.gray(originalRequestMethod + ' > ' + request.method + ' ' + request.url + ' | ') +
            chalk.magenta('Genie substituted HTTP method from ' + originalRequestMethod + ' to ' + request.method + ' as requested via ' + runtimeConfig.methodOverwriteHeader)
        );
    }
}

function patchConnectContext(request, response, next) {

    var originalResponseEnd = response.end,
        originalNext = next;

    response.end = function () {
        var withoutError = this.statusCode >= 200 && this.statusCode < 400;

        console.log(
            chalk.gray(request.method + ' ' + request.url + ' | ') +
            chalk[withoutError ? 'green' : 'red']('Genie is done. Status code: ' + this.statusCode)
        );

        originalResponseEnd.apply(response, arguments);
    };

    next = function () {
        response.end = originalResponseEnd;
        originalNext();
    };
}

function generateCurrentRequestContext(mockEntry, runtimeConfig, request, response, next) {
    // Generate current context data
    return {
        mockEntry: mockEntry,
        requestSubset: getSubsetFromRequest(request, runtimeConfig),
        requestSubsetShouldFallback: checkIfShouldFallbackToGlobals(request, runtimeConfig),
        request: request,
        response: response,
        next: next,
        registry: registry,
        pathParams: {
            ordered: [],
            map: {}
        }
    };
}

module.exports = function (runtimeConfig) {

    return function connectCompatibleMiddleware(request, response, next) {

        const mockEntry = getMockEntry(runtimeConfig, request);

        console.group(request.method + ' ' + request.url);

        // Check if this request should be at all handled by Genie based on path
        if (!mockEntry) {
            next();
            return;
        } else {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(request.method + ' ' + request.url + ' | ') +
                'Genie will try to handle this request for you'
            );
        }

        substituteMethodIfRequired(runtimeConfig, request);
        patchConnectContext(request, response, next);

        const currentRequestContext = generateCurrentRequestContext(mockEntry, runtimeConfig, request, response, next);

        // findAndExecuteAppropriateApproach
        currentRequestContext.requestSubset ?
            tryToHandleUsingSubset(runtimeConfig, currentRequestContext) :
            tryToHandleUsingGlobals(runtimeConfig, currentRequestContext);

        console.groupEnd();
    }

};
