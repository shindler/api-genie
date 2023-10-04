const _ = require('lodash');

const _registry = {};

module.exports = {
    get: function (inRegistryPath) {
        return _.get(_registry, inRegistryPath);
    },
    set: function (inRegistryPath, value) {
        return _.set(_registry, inRegistryPath, value);
    }
};
