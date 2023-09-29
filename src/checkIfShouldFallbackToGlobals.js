/**
     * Checks if fallback to global mode is on or off
     *
     * @param {object} current request object (provided by connect.js)
     * @return {bool} state
     */
module.exports = function checkIfShouldFallbackToGlobals(request, runtimeConfig) {

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
