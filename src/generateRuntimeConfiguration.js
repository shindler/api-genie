const _ = require('lodash');

module.exports = function generateRuntimeConfiguration() {

    const args = Array.from(arguments)
    const runtimeConf = _.assign({}, ...args);

    runtimeConf.pathTemplate = _.template(runtimeConf.pathTemplate);

    return runtimeConf;
}
