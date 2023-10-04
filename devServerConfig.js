module.exports = {
    mocksRootPath: 'dev/mocks/',
    mocksMap: [
        {
            testRegExp: /^\/api\//i,
            path: 'api/',
        },
        {
            testRegExp: /^\/apiWithTopMostIndex\//i,
            path: 'apiWithTopMostIndex/',
        },
        {
            testRegExp: /^\/apiWithFolderSpecificIndices\//i,
            path: 'apiWithFolderSpecificIndices/',
        },
        {
            testRegExp: /^\/apiWithStaticMocks\//i,
            path: 'apiWithStaticMocks/',
        },
        {
            testRegExp: /^\/apiWithDynamicMocks\//i,
            path: 'apiWithDynamicMocks/',
        },
        {
            testRegExp: /^\/apiWithDynamicSegments\//i,
            path: 'apiWithDynamicSegments/',
        },
        {
            testRegExp: /^\/apiWithSubsets\//i,
            path: 'apiWithSubsets/',
        }
    ],
    forcedSubset: null,
    beVerbose: true
};
