/* jshint maxstatements:false */
var fs = require('fs'),
    urlParser = require('url'),
    _ = require('lodash');

/**
 * API Genie
 *
 * @param {object} userConfig which will be merged with defaults
 * @param {object} grunt instance
 */
module.exports = function (userConfig, grunt) {

    'use strict';

    var apiGenie = this,

        defaultConfig = {
            // The document root of where the API endpoint resides
            serverDocumentRoot: '/api',
            // RegExp used to replace serverDocumentRoot from request url to get a clean path
            serverDocumentRootRegExp: /^\/api/i,
            // Path to mocks
            mocksLocalRootPath: 'mocks/api',

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

            // Force usage of given subset
            forcedSubset: null,

            // Static mocks cache
            cacheEnabled: false,

            // Function / LoDash template (default) that will help to generate the path to a mock
            pathTemplate: _.template('<%= root %><% if(subset) { %>/_subsets/<%= subset %><% } %><%= resource %>'),

            //List of glob patterns to find all static/dynamic mock files mocksLocalRootPath
            globPatternsForMocks: [
                '/**/*.js',
                '/**/*.json'
            ]
        },

        config = _.assign({}, defaultConfig, userConfig),

        mocksFound = config.cacheEnabled && grunt.file.expand({ cwd: config.mocksLocalRootPath }, config.globPatternsForMocks);

    this.cache = config.cacheEnabled ? (_.zipObject(mocksFound, _.map(_.range(1, mocksFound.length + 1), _.identity.bind(null, true))) || {}) : {};

    /**
     * Identifies and extracts subset for responses
     *
     * @param {object} current request object (provided by connect.js)
     * @return subset identifier
     */
    this.identifyAndExtractSubsetForResponses = function (request) {

        var requestHeaders = request.headers,
            subsetTriggeringHeader = config.subsetTriggeringHeader.toLowerCase();

        if (config.forcedSubset) {
            return config.forcedSubset;
        } else if (requestHeaders.hasOwnProperty(subsetTriggeringHeader) && requestHeaders[subsetTriggeringHeader].match(config.subsetTriggeringHeaderValueRegExp)) {
            return requestHeaders[subsetTriggeringHeader];
        } else {
            return '';
        }
    };

    /**
     * Checks if fallback to global mode is on or off
     *
     * @param {object} current request object (provided by connect.js)
     * @return {bool} state
     */
    this.checkIfShouldFallbackToGlobals = function (request) {

        var requestHeaders = request.headers,
            subsetFallbackModeHeader = config.subsetFallbackModeHeader;

        if (config.forcedSubset) {
            return true;
        } else if (requestHeaders.hasOwnProperty(subsetFallbackModeHeader) && requestHeaders[subsetFallbackModeHeader] === false) {
            return false;
        } else {
            return config.subsetFallbackToGlobals;
        }
    };

    /**
     * Setup a list of possible handlers for the request
     *
     * @param {object} current request object provided originally by connect.js
     * @param {string} path to mock
     * @return {array} array of possible handlers
     */
    this.setupAndGetPossibleHandlers = function (currentRequestContext, subset) {

        var resourceURLParsed = urlParser.parse(currentRequestContext.request.url),
            resourceURLPathname = resourceURLParsed.pathname.replace(config.serverDocumentRootRegExp, ''),

            handleUsingNodeModule = function (path) {
                var nodeModulePath = path.replace(/\.js$/, '');
                return require([process.cwd(), nodeModulePath].join('/'));
            },

            handleUsingSubsetResourceBasedOnUsedHTTPMethodWithStatic = function () {
                return {
                    willHandle: _.identity.bind(_, true),
                    execute: apiGenie.handleUsingStaticFile
                };
            },

            possibleHandlers = [
                /** First index.js in subset folder... */
                [
                    config.pathTemplate({
                        root: config.mocksLocalRootPath,
                        subset: subset || null,
                        resource: '/' + config.mockIndexFilename
                    }),
                    handleUsingNodeModule
                ],
                /** ...then check if index.js node module in folder */
                [
                    config.pathTemplate({
                        root: config.mocksLocalRootPath,
                        subset: subset || null,
                        resource: resourceURLPathname + '/' + config.mockIndexFilename
                    }),
                    handleUsingNodeModule
                ],
                /** ...then handle using method.js file... */
                [
                    config.pathTemplate({
                        root: config.mocksLocalRootPath,
                        subset: subset || null,
                        resource: resourceURLPathname + '/' + currentRequestContext.request.method + '.js'
                    }),
                    handleUsingNodeModule
                ],
                /** ...then handle using JSON... */
                [
                    config.pathTemplate({
                        root: config.mocksLocalRootPath,
                        subset: subset || null,
                        resource: resourceURLPathname + '/' + currentRequestContext.request.method + '.json'
                    }),
                    handleUsingSubsetResourceBasedOnUsedHTTPMethodWithStatic
                ]
            ];

        return possibleHandlers;
    };

    /**
     * Main logic for handling the request with provided helpers
     *
     * @param {object} current request object provided originally by connect.js
     * @param {string} path to mock
     */
    this.handleRequestUsing = function (possibleHandlers, currentRequestContext) {

        var tryToHandle = function () {

                var currentHandler = possibleHandlers.shift(),

                    handle = function (handlerExists) {

                        var handler;

                        if (handlerExists) {

                            handler = currentHandler[1](currentHandler[0]);

                            if (handler.willHandle.call(this, currentHandler[0], currentRequestContext)) {
                                return handler.execute.call(this, currentHandler[0], currentRequestContext);
                            }
                        }

                        tryToHandle();
                    };

                if (!currentHandler) {
                    currentRequestContext.next();
                    return;
                }

                if (apiGenie.cache.hasOwnProperty(currentHandler[0]) === false) {

                    fs.exists(currentHandler[0], function (handlingModuleExists) {

                        var handler;

                        if (config.cacheEnabled) {
                            (apiGenie.cache[currentHandler[0]] = handlingModuleExists);
                        }

                        if (handlingModuleExists) {

                            handler = currentHandler[1](currentHandler[0]);

                            if (handler.willHandle.call(this, currentHandler[0], currentRequestContext)) {
                                return handler.execute.call(this, currentHandler[0], currentRequestContext);
                            }
                        }

                        tryToHandle();

                    }.bind(this));

                } else {
                    handle(apiGenie.cache[currentHandler[0]]);
                }
            };

        tryToHandle();
        return;
    };

    /**
     * Try to handle the request using only global handlers
     *
     * @param {object} current request object provided originally by connect.js
     */
    this.tryToHandleUsingGlobals = function (currentRequestContext) {

        var possibleHandlers = this.setupAndGetPossibleHandlers(currentRequestContext, null);

        currentRequestContext.requestSubsetShouldFallback = false;

        this.handleRequestUsing(possibleHandlers, currentRequestContext);
    };

    /**
     * Try to handle the request using subset and if-required global handlers
     *
     * @param {object} current request object provided originally by connect.js
     */
    this.tryToHandleUsingSubset = function (currentRequestContext) {

        var possibleHandlers = this.setupAndGetPossibleHandlers(currentRequestContext, currentRequestContext.requestSubset);

        if (currentRequestContext.requestSubsetShouldFallback) {
            currentRequestContext.requestSubsetShouldFallback = false;
            possibleHandlers = possibleHandlers.concat(this.setupAndGetPossibleHandlers(currentRequestContext, null));
            currentRequestContext.requestSubsetShouldFallback = true;
        }

        this.handleRequestUsing(possibleHandlers, currentRequestContext);

    };

    /**
     * Handle current request using default handler
     *
     * @param {string} path to mock
     * @param {object} current request object provided originally by connect.js
     */
    this.handleUsingStaticFile = function (path, currentRequestContext, options) {

        fs.readFile(path, function (err, buf) {
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

    /**
     * CONNECT.js middleware definition
     *
     * @param {object} current request object
     * @param {object} current request response object
     * @param {object} current request forward to next
     */
    this.getConnectMiddelware = function () {
        return function (request, response, next) {

            var shouldGenieHandleTheRequest = (request.url.indexOf(config.serverDocumentRoot) === 0),
                currentRequestContext,
                findAndExecuteAppropriateApproach,
                originalResponseEnd = response.end;

            if (!shouldGenieHandleTheRequest) {
                grunt.verbose.warn(request.method + ' ' + request.url + ' (forwarding)');
                next();
                return;
            }

           grunt.verbose.writeln('Going to handle: ' + request.method + ' ' + request.url);

            if (request.headers.hasOwnProperty(config.methodOverwriteHeader)) {
               request.method = request.headers[config.methodOverwriteHeader];
            }

            response.end = function () {
                grunt.verbose.ok(request.method + ' ' + request.url + ' with ' + this.statusCode);
                originalResponseEnd.apply(response, arguments);
            };

            currentRequestContext = {
                requestSubset: apiGenie.identifyAndExtractSubsetForResponses(request),
                requestSubsetShouldFallback: apiGenie.checkIfShouldFallbackToGlobals(request),
                request: request,
                response: response,
                next: next
            };

            /**
             * Find and execute appropriate approach to handle the request
             */
            findAndExecuteAppropriateApproach = function () {

                var subsetRootPath = config.pathTemplate({
                        root: config.mocksLocalRootPath,
                        subset: currentRequestContext.requestSubset,
                        resource: ''
                    }),

                    handleWithSubsetUsed = function (subsetExists) {

                        if (subsetExists) {

                            apiGenie.tryToHandleUsingSubset(currentRequestContext);

                        } else if (subsetExists === false && currentRequestContext.requestSubsetShouldFallback) {

                            apiGenie.tryToHandleUsingGlobals(currentRequestContext);

                        } else if (subsetExists === false && !currentRequestContext.requestSubsetShouldFallback) {

                            next();
                            return;

                        }
                    };

                if (currentRequestContext.requestSubset) {

                    if (apiGenie.cache.hasOwnProperty(subsetRootPath) === false) {

                        fs.exists(subsetRootPath, function (subsetExists) {

                            if (config.cacheEnabled) {
                                (apiGenie.cache[subsetRootPath] = subsetExists);
                            }

                            handleWithSubsetUsed.call(currentRequestContext, subsetExists);

                        }.bind(this));

                    } else {
                        handleWithSubsetUsed.call(currentRequestContext, apiGenie.cache[subsetRootPath]);
                    }
                } else {
                    apiGenie.tryToHandleUsingGlobals(currentRequestContext);
                }

            };

            findAndExecuteAppropriateApproach();
        };

    };
};
