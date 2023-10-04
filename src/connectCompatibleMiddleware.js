const url = require('url');
const chalk = require('chalk').default;

const getSubsetFromRequest = require('./getSubsetFromRequest');
const checkIfShouldFallbackToGlobals = require('./checkIfShouldFallbackToGlobals');
const registry = require('./registry');
const { tryToHandleUsingSubset, tryToHandleUsingGlobals } = require('./tryToHandle');

function getMockEntry(runtimeConfig, request) {
    return runtimeConfig.mocksMap.find((mockEntry) => {
        return request.url.match(mockEntry.testRegExp) !== null;
    });
}

function substituteMethodIfRequired(runtimeConfig, request) {
    if (request.headers.hasOwnProperty(runtimeConfig.methodOverwriteHeader)) {
        const originalRequestMethod = request.method;
        const context = request.method + ' ' + url.parse(request.url).pathname;

        request.method = request.headers[runtimeConfig.methodOverwriteHeader];

        runtimeConfig.beVerbose && console.log(
            chalk.gray(originalRequestMethod + ' > ' + context + ' | ') +
            chalk.magenta('Genie substituted HTTP method from ' + originalRequestMethod + ' to ' + request.method + ' as requested via ' + runtimeConfig.methodOverwriteHeader)
        );
    }
}

function patchConnectContext(runtimeConfig, request, response, next) {

    const originalResponseEnd = response.end;
    const originalNext = next;
    const context = request.method + ' ' + url.parse(request.url).pathname;

    response.end = function () {
        const withoutError = this.statusCode >= 200 && this.statusCode < 400;

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
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
    const urlParts = url.parse(request.url, true);
    // Generate current context data
    return {
        context: request.method + ' ' + url.parse(request.url).pathname,
        mockEntry: mockEntry,
        requestSubset: getSubsetFromRequest(request, runtimeConfig),
        requestSubsetShouldFallback: checkIfShouldFallbackToGlobals(request, runtimeConfig),
        request: {
            ...request,
            query: {
                ...urlParts.query
            }
        },
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
        const context = request.method + ' ' + url.parse(request.url).pathname

        runtimeConfig.beVerbose && console.group(context);

        // Check if this request should be at all handled by Genie based on path
        if (!mockEntry) {
            next();
            return;
        } else {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(context + ' | ') +
                'Genie will try to handle this request for you'
            );
        }

        substituteMethodIfRequired(runtimeConfig, request);
        patchConnectContext(runtimeConfig, request, response, next);

        const currentRequestContext = generateCurrentRequestContext(mockEntry, runtimeConfig, request, response, next);

        // findAndExecuteAppropriateApproach
        currentRequestContext.requestSubset ?
            tryToHandleUsingSubset(runtimeConfig, currentRequestContext) :
            tryToHandleUsingGlobals(runtimeConfig, currentRequestContext);

        runtimeConfig.beVerbose && console.groupEnd();
    }

};
