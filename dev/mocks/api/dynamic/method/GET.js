module.exports = {

    willHandle: function () {
        return true;
    },

    execute: function (mockPath, currentRequestContext) {
        var options = {
                headers: {
                    'Content-Type': 'plain/text'
                }
            };

        currentRequestContext.response.end('Done with simple dynamic mock based on http method');
    }
};
