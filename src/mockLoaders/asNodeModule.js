function cleanupCache(nodeModuleToLoad) {

    if (!require.cache[require.resolve(nodeModuleToLoad)]) {
        return;
    }

    const nodeModule = require.cache[require.resolve(nodeModuleToLoad)];

    if (!nodeModule) {
        return
    }

    nodeModule.children && nodeModule.children.forEach((childModule) => {
        childModule.exports['cleanup'] && childModule.exports.cleanup();
        delete require.cache[childModule.id];
    });

    nodeModule.exports['cleanup'] && nodeModule.exports.cleanup();
    delete require.cache[require.resolve(nodeModuleToLoad)];
}

module.exports = function (path) {

    return {
        load: loadAsNodeModule
    };

    function loadAsNodeModule() {

        const nodeModulePath = path.replace(/\.js$/, ''),
            nodeModuleToLoad = [nodeModulePath].join('/');

        cleanupCache(nodeModuleToLoad);

        return require(nodeModuleToLoad);
    }
};
