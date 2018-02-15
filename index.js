/* jshint maxstatements:false */
var fs = require('fs'),
    path = require('path'),
    urlParser = require('url'),
    _ = require('lodash'),
    chalk = require('chalk'),
    util = require('util'),

    defaultConfig = {

        mocksMap: [
            {
                testRegExp: /^\/api/i,
                mocksRootPath: 'mocks/api'
            }
        ],

        // Header name triggering a subset
        subsetTriggeringHeader: 'x-apigenie-subset',
        // RegExp to test the subsetTriggeringHeader if it's a valid subset
        subsetTriggeringHeaderValueRegExp: /^(CASE\-([a-z0-9_]+))$/,

        // Header name which is enabled/disable fallback to globals
        subsetFallbackModeHeader: 'x-apigenie-subset-fallback',
        // Default status of fallback
        subsetFallbackToGlobals: true,

        // Header name which value will be used to overwrite used HTTP method
        methodOverwriteHeader: 'x-http-method-override',

        // Dynamic mock file name it
        mockIndexFilename: 'index.js',
        mockDirectoryIndexFilename: 'directory.js',

        // Force usage of given subset (enforce fallback to globals)
        forcedSubset: null,

        // Function / LoDash template (default) that will help to generate the path to a mock
        pathTemplate: '<%= root %><% if(subset) { %>_subsets/<%= subset %>/<% } %><%= resource %>',

        // Be verbose with messages
        beVerbose: false
    },

    _registry = {},

    registry = {
        get: function (inRegistryPath) {
            return _.get(_registry, inRegistryPath);
        },
        set: function (inRegistryPath, value) {
            return _.set(_registry, inRegistryPath, value);
        }
    };


/**
 * API Genie
 *
 * @param {object} userConfig which will be merged with defaults
 */
module.exports = function (userConfig) {

    'use strict';

    var apiGenie = this,

        runtimeConfig = generateRuntimeConfiguration(defaultConfig, userConfig);

    return getMiddleware();

    function generateRuntimeConfiguration() {

        var args = Array.from(arguments),
            runtimeConf = Object.assign({}, ...args);

        runtimeConf.beVerbose && console.log(chalk.blue('API Genie has been summoned to existence!'));

        runtimeConf.pathTemplate = _.template(runtimeConf.pathTemplate);

        return runtimeConf;
    }

    /**
     * Get middleware compatibile with connect.js
     */
    function getMiddleware() {

        return connectCompatibleMiddleware;
        /**
         * @param {object} current request object
         * @param {object} current request response object
         * @param {object} current request forward to next
         */
        function connectCompatibleMiddleware(request, response, next) {

            var mockEntry = getMockEntry(),

                currentRequestContext;

            // Check if this request should be at all handled by Genie based on path
            if (!mockEntry) {
                next();
                return;
            } else {
                runtimeConfig.beVerbose && console.log(chalk.gray(request.method + ' ' + request.url + ' | ') + 'Genie will try to handle this request for you');
            }

            substituteMethodIfRequired();
            patchWhatNeeded();
            generateCurrentRequestContext();
            findAndExecuteAppropriateApproach();

            function getMockEntry() {
                return runtimeConfig.mocksMap.find((mockEntry) => {
                    return request.url.match(mockEntry.testRegExp) !== null;
                });
            }

            function substituteMethodIfRequired() {
                if (request.headers.hasOwnProperty(runtimeConfig.methodOverwriteHeader)) {
                    request.method = request.headers[methodOverwriteHeader];
                }
            }

            function patchWhatNeeded() {

                var originalResponseEnd = response.end,
                    originalNext = next;

                response.end = function () {
                    var withoutError = this.statusCode >= 200 && this.statusCode < 400;

                    console.log(chalk.gray(request.method + ' ' + request.url + ' | ') + chalk[withoutError ? 'green' : 'red']('Genie is done. Status code: ' + this.statusCode));

                    originalResponseEnd.apply(response, arguments);
                };

                next = function () {
                    response.end = originalResponseEnd;
                    originalNext();
                };
            }

            function generateCurrentRequestContext() {
                // Generate current context data
                currentRequestContext = {
                    mockEntry: mockEntry,
                    requestSubset: getSubsetFromRequest(request),
                    requestSubsetShouldFallback: checkIfShouldFallbackToGlobals(request),
                    request: request,
                    response: response,
                    next: next,
                    registry: registry
                };
            }

            function findAndExecuteAppropriateApproach() {

                var subsetRootPath = runtimeConfig.pathTemplate({
                        root: currentRequestContext.mockEntry.mocksRootPath,
                        subset: currentRequestContext.requestSubset,
                        resource: ''
                    });

                if (currentRequestContext.requestSubset) {

                    runtimeConfig.beVerbose && console.log(
                        chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                        'Genie will check if requested subset ' + currentRequestContext.requestSubset + ' exists'
                    );

                    fs.exists(subsetRootPath, (subsetExists) => {

                        if (subsetExists) {

                            tryToHandleUsingSubset(currentRequestContext);

                        } else if (subsetExists === false && currentRequestContext.requestSubsetShouldFallback) {

                            runtimeConfig.beVerbose && console.log(
                                chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                                chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. Falling back as requested to globals')
                            );

                            tryToHandleUsingGlobals(currentRequestContext);

                        } else if (subsetExists === false && !currentRequestContext.requestSubsetShouldFallback) {

                            runtimeConfig.beVerbose && console.log(
                                chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                                chalk.yellow('Genie was unable to find requested subset: ' + currentRequestContext.requestSubset + '. No fallback as requested!')
                            );

                            fail(currentRequestContext);
                            return;
                        }
                    });

                } else {

                    tryToHandleUsingGlobals(currentRequestContext);
                }

            }

        };
    };


    function fail(currentRequestContext) {
        currentRequestContext.response.writeHead(404);
        currentRequestContext.response.end('404 | No matching mock file was found');
    }

    /**
     * Guess the subset
     *
     * @param {object} current request object (provided by connect.js)
     * @return subset identifier
     */
    function getSubsetFromRequest(request) {

        var requestHeaders = request.headers,

            subsetTriggeringHeader = runtimeConfig.subsetTriggeringHeader.toLowerCase(),

            isSubsetForced = !!runtimeConfig.forcedSubset,
            isSubsetDefinedByHeader = requestHeaders.hasOwnProperty(subsetTriggeringHeader) && !!requestHeaders[subsetTriggeringHeader].match(runtimeConfig.subsetTriggeringHeaderValueRegExp)

        if (isSubsetForced) {
            return runtimeConfig.forcedSubset;
        } else if (isSubsetDefinedByHeader) {
            return requestHeaders[subsetTriggeringHeader];
        }

        return '';
    }

    /**
     * Checks if fallback to global mode is on or off
     *
     * @param {object} current request object (provided by connect.js)
     * @return {bool} state
     */
    function checkIfShouldFallbackToGlobals(request) {

        var requestHeaders = request.headers,
            subsetFallbackModeHeader = runtimeConfig.subsetFallbackModeHeader,

            isSubsetForced = !!runtimeConfig.forcedSubset,
            isFallbackBlockedByHeader = requestHeaders.hasOwnProperty(subsetFallbackModeHeader) && requestHeaders[subsetFallbackModeHeader] === 'false'

        if (isSubsetForced) {
            return true;
        } else if (isFallbackBlockedByHeader) {
            return false;
        }

        return runtimeConfig.subsetFallbackToGlobals;
    }

    /**
     * Setup a list of possible handlers for the request
     *
     * @param {object} current request object provided originally by connect.js
     * @return {array} array of possible handlers
     */
    function getRequestHandlers(currentRequestContext, subset) {

        var resourceURLParsed = urlParser.parse(currentRequestContext.request.url),
            resourceURLPathname = resourceURLParsed.pathname.replace(currentRequestContext.mockEntry.testRegExp, ''),

            possibleHandlers = [
                /** First look for index.js in top most folder... */
                {
                    fileLocation: runtimeConfig.pathTemplate({
                        root: currentRequestContext.mockEntry.mocksRootPath,
                        subset: subset || null,
                        resource: runtimeConfig.mockIndexFilename
                    }),
                    factory: handleRequestUsingNodeModule,
                    whoAmI: function () {
                        runtimeConfig.beVerbose && console.log(
                            chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                            'Genie is trying to use dynamic mock: a index.js in top most folder for given entrypoint(' + this.fileLocation + ')'
                        );
                    }
                },
                /** ...then look for index.js in folder */
                {
                    fileLocation: runtimeConfig.pathTemplate({
                        root: currentRequestContext.mockEntry.mocksRootPath,
                        subset: subset || null,
                        resource: path.normalize((resourceURLPathname || '.') + '/' + runtimeConfig.mockIndexFilename)
                    }),
                    factory: handleRequestUsingNodeModule,
                    whoAmI: function () {
                        runtimeConfig.beVerbose && console.log(
                            chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                            'Genie is trying to use dynamic mock: a index.js file from matching path (' + this.fileLocation + ')'
                        );
                    }
                },
                /** ...then look for .js file named after http method that is used ... */
                {
                    fileLocation: runtimeConfig.pathTemplate({
                        root: currentRequestContext.mockEntry.mocksRootPath,
                        subset: subset || null,
                        resource: path.normalize((resourceURLPathname || '.') + '/' + currentRequestContext.request.method + '.js')
                    }),
                    factory: handleRequestUsingNodeModule,
                    whoAmI: function () {
                        runtimeConfig.beVerbose && console.log(
                            chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                            'Genie is trying to use dynamic mock: a JS file named after http method (' + this.fileLocation + ')'
                        );
                    }
                },
                /** ...then look for JSON file named after http method that is used ... */
                {
                    fileLocation: runtimeConfig.pathTemplate({
                        root: currentRequestContext.mockEntry.mocksRootPath,
                        subset: subset || null,
                        resource: path.normalize((resourceURLPathname || '.') + '/' + currentRequestContext.request.method + '.json')
                    }),
                    factory: handleRequestUsingStaticFile,
                    whoAmI: function () {
                        runtimeConfig.beVerbose && console.log(
                            chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') +
                            'Genie is trying to use static mock: a JSON file named after http method (' + this.fileLocation + ')'
                        );
                    }
                }
            ];

        return possibleHandlers;


        function handleRequestUsingNodeModule(nodeModulePathToUse) {

            var nodeModulePath = nodeModulePathToUse.replace(/\.js$/, ''),
                nodeModuleToLoad = [process.cwd(), nodeModulePath].join('/');

            if (require.cache[require.resolve(nodeModuleToLoad)]) {
                cleanup();
                delete require.cache[require.resolve(nodeModuleToLoad)];
            }

            return require(nodeModuleToLoad);

            function cleanup() {
                var nodeModule = require(nodeModuleToLoad);
                nodeModule.cleanup && nodeModule.cleanup();
            }
        }

        function handleRequestUsingStaticFile() {
            // return object that complies with handler interface expectations
            return {
                willHandle: _.identity.bind(_, true),
                execute: handleUsingStaticFile
            };

            function handleUsingStaticFile(staticFilePath, currentRequestContext, options) {

                fs.readFile(staticFilePath, function (err, buf) {
                    var resp;

                    if (err) {
                        return currentRequestContext.next(err);
                    }

                    resp = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': buf.length
                        },
                        body: buf
                    };

                    if (options && options.hasOwnProperty('headers')) {
                        _.assign(resp.headers, options.headers);
                    }

                    currentRequestContext.response.writeHead((options && options.hasOwnProperty('statusCode')) ? options.statusCode : 200, resp.headers);
                    currentRequestContext.response.end(resp.body);
                });
            };
        }
    }

    /**
     * Try to handle the request using only global handlers
     *
     * @param {object} current request object provided originally by connect.js
     */
    function tryToHandleUsingGlobals(currentRequestContext) {

        var possibleHandlers = getRequestHandlers(currentRequestContext, null);

        currentRequestContext.requestSubsetShouldFallback = false;

        runtimeConfig.beVerbose && console.log(chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') + 'Genie is trying with global mocks');

        handleRequest(possibleHandlers, currentRequestContext);
    }

    /**
     * Try to handle the request using subset and if-required global handlers
     *
     * @param {object} current request object provided originally by connect.js
     */
    function tryToHandleUsingSubset(currentRequestContext) {

        var possibleHandlers = getRequestHandlers(currentRequestContext, currentRequestContext.requestSubset);

        if (currentRequestContext.requestSubsetShouldFallback) {
            currentRequestContext.requestSubsetShouldFallback = false;
            possibleHandlers = possibleHandlers.concat(getRequestHandlers(currentRequestContext, null));
            currentRequestContext.requestSubsetShouldFallback = true;
        }

        runtimeConfig.beVerbose && console.log(chalk.gray(currentRequestContext.request.method + ' ' + currentRequestContext.request.url + ' | ') + 'Genie is trying with a subset ' + currentRequestContext.requestSubset + ' of mocks ' + (currentRequestContext.requestSubsetShouldFallback ? 'with' : 'without') + ' fallback');

        handleRequest(possibleHandlers, currentRequestContext);
    }

    /**
     * Main logic for handling the request with provided helpers
     */
    function handleRequest(possibleHandlers, currentRequestContext) {

        // try to handle request
        tryToHandle();

        return;

        function tryToHandle() {

            var currentHandler = possibleHandlers.shift();

            if (!currentHandler) {
                fail(currentRequestContext);
                return;
            }

            currentHandler.whoAmI();

            fs.exists(currentHandler.fileLocation, (handlingModuleExists) => {

                var handler;

                if (handlingModuleExists) {

                    handler = currentHandler.factory(currentHandler.fileLocation);

                    if (handler.willHandle(currentHandler.fileLocation, currentRequestContext)) {
                        return handler.execute(currentHandler.fileLocation, currentRequestContext);
                    }
                } else {

                }

                // try to handle the request with next possible handler
                tryToHandle();

            });
        }
    }
};
