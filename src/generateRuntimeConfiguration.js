const _ = require('lodash');

module.exports = function generateRuntimeConfiguration() {

    var args = Array.from(arguments),
        runtimeConf = Object.assign({}, ...args);

    runtimeConf.pathTemplate = _.template(runtimeConf.pathTemplate);

    return runtimeConf;
}
