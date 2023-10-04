module.exports = {

    willHandle: function () {
        return true;
    },

    execute: function (mockPath, currentRequestContext) {
        currentRequestContext.response.end(JSON.stringify({
            "dynamicMock": true,
            "paramsMap": currentRequestContext.pathParams.map,
            "paramsOrdered": currentRequestContext.pathParams.ordered
        }));
    }
};
