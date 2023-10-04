const fs = require("fs");
const path = require("path");
const chalk = require("chalk").default;

const getRequestHandlers = require("./getRequestHandlers");
const storageDriver = require("./mockStorageDrivers/fsDriver");
const asStaticFile = require("./mockLoaders/asStaticFile");
const asNodeModule = require("./mockLoaders/asNodeModule");
const signalFailure = require("./signalFailure");

module.exports.tryToHandleUsingGlobals = tryToHandleUsingGlobals;
module.exports.tryToHandleUsingSubset = tryToHandleUsingSubset;

/**
 * Try to handle the request using only global handlers
 *
 * @param {object} runtimeConfig
 * @param {object} currentRequestContext current request object provided originally by connect.js
 */
function tryToHandleUsingGlobals(runtimeConfig, currentRequestContext) {

    const possibleHandlers = getRequestHandlers(runtimeConfig, currentRequestContext);

    currentRequestContext.requestSubsetShouldFallback = false;

    runtimeConfig.beVerbose && console.log(
        chalk.gray(currentRequestContext.context + ' | ') +
        'Genie is trying with global mocks'
    );
    runtimeConfig.beVerbose && console.log(
        chalk.gray(currentRequestContext.context + ' | ') +
        'Genie found ' + possibleHandlers.length + ' handler(s) for this request...'
    );

    handleRequest(runtimeConfig, possibleHandlers, currentRequestContext);
}

/**
 * Try to handle the request using subset and if-required global handlers
 *
 * @param {object} runtimeConfig
 * @param {object} currentRequestContext current request object provided originally by connect.js
 */
function tryToHandleUsingSubset(runtimeConfig, currentRequestContext) {

    const subsetRootPath = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: currentRequestContext.requestSubset,
        resource: ''
    });

    runtimeConfig.beVerbose && console.log(
        chalk.gray(currentRequestContext.context + ' | ') +
        'Genie will check if requested subset ' + currentRequestContext.requestSubset + ' exists'
    );

    const subsetExists = storageDriver.pathExists(subsetRootPath);

    if (subsetExists) {

        const possibleHandlers = getRequestHandlers(runtimeConfig, currentRequestContext, true);

        if (currentRequestContext.requestSubsetShouldFallback) {
            currentRequestContext.requestSubsetShouldFallback = false;
            possibleHandlers.push.apply(possibleHandlers, getRequestHandlers(runtimeConfig, currentRequestContext));
            currentRequestContext.requestSubsetShouldFallback = true;
        }

        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            'Genie is trying with a subset ' + currentRequestContext.requestSubset + ' of mocks ' + (currentRequestContext.requestSubsetShouldFallback ? 'with' : 'without') + ' fallback'
        );

        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            'Genie found ' + possibleHandlers.length + ' handler(s) for this request...'
        );

        handleRequest(runtimeConfig, possibleHandlers, currentRequestContext);

    } else if (subsetExists === false && currentRequestContext.requestSubsetShouldFallback) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. Falling back as requested to globals')
        );

        tryToHandleUsingGlobals(runtimeConfig, currentRequestContext);

    } else if (subsetExists === false && !currentRequestContext.requestSubsetShouldFallback) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. No fallback as requested!')
        );

        signalFailure(currentRequestContext);
    }

}


function handleRequest(runtimeConfig, possibleHandlers, currentRequestContext) {

    if (possibleHandlers.length === 0) {
        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            chalk.yellow('Genie didn\'t found handlers... forwarding')
        );

        signalFailure(currentRequestContext);

        return;
    }

    let currentHandler;
    let mock;

    while (!!(currentHandler = possibleHandlers.shift())) {

        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            chalk.yellow(`${currentHandler.name} `) +
            `will try to use a ${currentHandler.nature} mock at ${currentHandler.path}`
        );

        if (currentHandler.hasOwnProperty('pathParams') || currentHandler.hasOwnProperty('pathParamsMap')) {
            currentRequestContext.pathParams.ordered = currentHandler.pathParams
            currentRequestContext.pathParams.map = currentHandler.pathParamsMap
        }

        switch (currentHandler.nature) {
            case 'static':
                mock = asStaticFile(currentHandler.path).load();
                break;
            case 'dynamic':
                mock = asNodeModule(currentHandler.path).load();
                break;
        }

        if (!mock) {
            signalFailure(500, `500 | Couldn\'t load ${currentHandler.path}`)
            return;
        }

        if (mock.willHandle(currentRequestContext)) {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(currentRequestContext.context + ' | ') +
                chalk.yellow(`${currentHandler.name} `) +
                'got a reply from the mock it is willing to respond... executing'
            );

            currentRequestContext.response.setHeader(
                'x-apigenie-mock-used',
                path.relative('.', currentHandler.path).replace(runtimeConfig.mocksRootPath, '')
            );

            return mock.execute(currentHandler.fileLocation, currentRequestContext);
        } else {
            runtimeConfig.beVerbose && console.log(
                chalk.gray(currentRequestContext.context + ' | ') +
                chalk.yellow(`${currentHandler.name} `) +
                'got a reply from mock that it will not handle this request... forwarding to next handler'
            );

            continue;
        }
    }

    if (!currentHandler) {
        runtimeConfig.beVerbose && console.log(
            chalk.gray(currentRequestContext.context + ' | ') +
            chalk.yellow('Genie didn\'t found any more handlers... signaling failure')
        );

        signalFailure(currentRequestContext);

        return;
    }
}


