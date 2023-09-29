/**
     * Guess the subset
     *
     * @param {object} current request object (provided by connect.js)
     * @return subset identifier
     */
module.exports = function getSubsetFromRequest(request, runtimeConfig) {

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
