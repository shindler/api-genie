module.exports = function signalFailure(currentRequestContext, statusCode = 404, msg = 'No matching mock file was found') {
    currentRequestContext.response.writeHead(404);
    currentRequestContext.response.end(`${statusCode} | ${msg}`);
}
