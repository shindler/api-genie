const fs = require("fs");
const chalk = require("chalk").default;
const path = require("path");

const getRequestHandlers = require("./getRequestHandlers");
/**
 * Try to handle the request using only global handlers
 *
 * @param {object} current request object provided originally by connect.js
 */
function tryToHandleUsingGlobals(runtimeConfig, currentRequestContext) {

    const possibleHandlers = getRequestHandlers(runtimeConfig, currentRequestContext);
    const context = currentRequestContext.request.method + ' ' + currentRequestContext.request.url;

    currentRequestContext.requestSubsetShouldFallback = false;

    runtimeConfig.beVerbose && console.log(
        chalk.gray(context + ' | ') +
        'Genie is trying with global mocks'
    );
    runtimeConfig.beVerbose && console.log(
        chalk.gray(context + ' | ') +
        'Genie found ' + possibleHandlers.length + ' handler(s) for this request...'
    );

    handleRequest(runtimeConfig, possibleHandlers, currentRequestContext, context);
}

/**
 * Try to handle the request using subset and if-required global handlers
 *
 * @param { object } current request object provided originally by connect.js
 */
function tryToHandleUsingSubset(runtimeConfig, currentRequestContext) {

    const subsetRootPath = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: currentRequestContext.requestSubset,
        resource: ''
    });
    const context = currentRequestContext.request.method + ' ' + currentRequestContext.request.url;

    runtimeConfig.beVerbose && console.log(
        chalk.gray(context + ' | ') +
        'Genie will check if requested subset ' + currentRequestContext.requestSubset + ' exists'
    );

    const subsetExists = fs.existsSync(subsetRootPath);

    if (subsetExists) {

        var possibleHandlers = getRequestHandlers(runtimeConfig, currentRequestContext, true);

        if (currentRequestContext.requestSubsetShouldFallback) {
            currentRequestContext.requestSubsetShouldFallback = false;
            possibleHandlers.push.apply(possibleHandlers, getRequestHandlers(runtimeConfig, currentRequestContext));
            currentRequestContext.requestSubsetShouldFallback = true;
        }

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            'Genie is trying with a subset ' + currentRequestContext.requestSubset + ' of mocks ' + (currentRequestContext.requestSubsetShouldFallback ? 'with' : 'without') + ' fallback'
        );

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            'Genie found ' + possibleHandlers.length + ' handler(s) for this request...'
        );

        handleRequest(runtimeConfig, possibleHandlers, currentRequestContext, context);

    } else if (subsetExists === false && currentRequestContext.requestSubsetShouldFallback) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. Falling back as requested to globals')
        );

        tryToHandleUsingGlobals(runtimeConfig, currentRequestContext);

    } else if (subsetExists === false && !currentRequestContext.requestSubsetShouldFallback) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. No fallback as requested!')
        );

        signalFailure(currentRequestContext);
    }

}


function handleRequest(runtimeConfig, possibleHandlers, currentRequestContext, context) {

    if (possibleHandlers.length === 0) {
        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            chalk.yellow('Genie didn\'t found handlers... forwarding')
        );

        signalFailure(currentRequestContext);

        return;
    }

    let currentHandler;

    while (!!(currentHandler = possibleHandlers.shift())) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            chalk.yellow(`${currentHandler.name} `) +
            `will try to use a ${currentHandler.nature} mock at ${currentHandler.file}`
        );

        if (currentHandler.hasOwnProperty('pathParams') || currentHandler.hasOwnProperty('pathParamsMap')) {
            currentRequestContext.pathParams.ordered = currentHandler.pathParams
            currentRequestContext.pathParams.map = currentHandler.pathParamsMap
        }

        let mock = currentHandler.loader.load(currentHandler.fileLocation);

        if (mock.willHandle(currentRequestContext)) {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(context + ' | ') +
                chalk.yellow(`${currentHandler.name} `) +
                'got a reply from the mock it is willing to respond... executing'
            );

            return mock.execute(currentHandler.fileLocation, currentRequestContext);
        } else {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(context + ' | ') +
                chalk.yellow(`${currentHandler.name} `) +
                'got a reply from mock that it will not handle this request... forwarding to next handler'
            );

            continue;
        }
    }

    if (!currentHandler) {
        runtimeConfig.beVerbose && console.log(
            chalk.gray(context + ' | ') +
            chalk.yellow('Genie didn\'t found any more handlers... signaling failure')
        );
        signalFailure(currentRequestContext);
        return;
    }
}

function signalFailure(currentRequestContext, msg = '404 | No matching mock file was found') {
    currentRequestContext.response.writeHead(404);
    currentRequestContext.response.end(msg);
}


module.exports.tryToHandleUsingGlobals = tryToHandleUsingGlobals;
module.exports.tryToHandleUsingSubset = tryToHandleUsingSubset;
module.exports.signalFailure = signalFailure;
