module.exports = {
    mocksRootPath: 'mocks/',

    mocksMap: [
        {
            testRegExp: /^\/api/i,
            path: 'api/'
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

    // Force usage of given subset (enforce fallback to globals)
    forcedSubset: null,

    // Function / LoDash template (default) that will help to generate the path to a mock
    pathTemplate: '<%= root %><% if(subset) { %>_subsets/<%= subset %>/<% } else { %>/<% } %><%= resource %>',

    // Be verbose with messages
    beVerbose: false
};
