module.exports = {

    willHandle: function (currentRequestContext) {
        return currentRequestContext.request.query.hasOwnProperty('notHandle') ? false : true;
    },

    execute: function (mockPath, currentRequestContext) {
        currentRequestContext.response.end();
    }
};
