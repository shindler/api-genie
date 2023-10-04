/**
     * Guess the subset
     *
     * @param {object} current request object (provided by connect.js)
     * @return subset identifier
     */
module.exports = function getSubsetFromRequest(request, runtimeConfig) {

    const requestHeaders = request.headers;
    const subsetTriggeringHeader = runtimeConfig.subsetTriggeringHeader.toLowerCase();

    const isSubsetForced = !!runtimeConfig.forcedSubset;
    const isSubsetDefinedByHeader = (
        requestHeaders.hasOwnProperty(subsetTriggeringHeader) &&
        !!requestHeaders[subsetTriggeringHeader].match(runtimeConfig.subsetTriggeringHeaderValueRegExp)
    );

    if (isSubsetForced) {
        return runtimeConfig.forcedSubset;
    } else if (isSubsetDefinedByHeader) {
        return requestHeaders[subsetTriggeringHeader];
    }

    return '';
}
