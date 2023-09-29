var fs = require('fs');

function cleanupCache(nodeModuleToLoad) {
    var nodeModule = require(nodeModuleToLoad);
    nodeModule.cleanup && nodeModule.cleanup();
}

module.exports = function (location) {
    return {
        load: loadAsNodeModule,
    };

    function loadAsNodeModule() {

        var nodeModulePath = location.replace(/\.js$/, ''),
            nodeModuleToLoad = [nodeModulePath].join('/');

        if (require.cache[require.resolve(nodeModuleToLoad)]) {
            cleanupCache(nodeModuleToLoad);
            delete require.cache[require.resolve(nodeModuleToLoad)];
        }

        return require(nodeModuleToLoad);
    }
}
