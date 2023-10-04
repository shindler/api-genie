const path = require('path');

const storageDriver = require('./../mockStorageDrivers/fsDriver');

function getDynamicSegmentsHandlers(runtimeConfig, resourceURLWithinPath, currentRequestContext, includeSubset = false) {
    let [...segments] = resourceURLWithinPath.split('/');
    let pathParams = [];
    let pathParamsMap = {};

    if (!Array.isArray(segments) || !segments.length) {
        return [];
    }

    let effectivePath = '';
    let mappingFailed = false;

    segments.forEach((segment) => {

        const currentSegmentPath = path.normalize(runtimeConfig.pathTemplate({
            root: path.resolve(runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
            subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
            resource: path.join(effectivePath, segment)
        }));

        const currentSegmentPathWithAny = path.normalize(runtimeConfig.pathTemplate({
            root: path.resolve(runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
            subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
            resource: path.join(effectivePath, '%any')
        }));

        const segmentIsExactMatch = storageDriver.pathExists(currentSegmentPath + '/');
        const segmentIsDynamicMatch = storageDriver.pathExists(currentSegmentPathWithAny + '/');

        if (segmentIsDynamicMatch) {
            const paramIndex = pathParams.length;
            const paramName = (
                storageDriver.pathExists(currentSegmentPathWithAny + '/_PARAM') &&
                storageDriver.pathRead(currentSegmentPathWithAny + '/_PARAM') ||
                '@' + paramIndex
            );
            const segmentIndex = (currentRequestContext.mockEntry.path + effectivePath).split('/').length;

            effectivePath += segmentIsExactMatch ? `${segment}/` : '%any/';

            const paramDescriptor = {
                value: segment,
                /** Position within segments */
                segmentIndex: segmentIndex,
                /** Position within params */
                paramIndex: paramIndex,
                /** Segment correlation to path in fs */
                effectivePath: currentRequestContext.mockEntry.path + effectivePath
            };

            // add it to ordered collection
            pathParams.push(paramDescriptor);

            // add to map
            pathParamsMap[paramName] = paramDescriptor;
            pathParamsMap['@' + paramIndex] = paramDescriptor;

            return;
        } else if (segmentIsExactMatch && !segmentIsDynamicMatch) {
            effectivePath += segment + '/';
            return;
        }

        mappingFailed = true;
    });

    if (mappingFailed) {
        return [];
    }

    const possibleHandlers = [];

    const jsFileWithinDynamicPath = runtimeConfig.pathTemplate({
        root: path.resolve(currentRequestContext.mockEntry.rootPath || runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize(effectivePath + '/' + currentRequestContext.request.method + '.js')
    });

    storageDriver.pathExists(jsFileWithinDynamicPath) ?
        possibleHandlers.push(
            {
                name: 'dynamicSegmentsJsHandler',
                path: jsFileWithinDynamicPath,
                nature: 'dynamic',
                pathParams,
                pathParamsMap
            }
        ) : void (0);

    const jsonFileWithinDynamicPath = runtimeConfig.pathTemplate({
        root: path.resolve(runtimeConfig.mocksRootPath, currentRequestContext.mockEntry.path),
        subset: includeSubset && currentRequestContext['subset'] ? currentRequestContext['subset'] : null,
        resource: path.normalize(effectivePath + '/' + currentRequestContext.request.method + '.json')
    });

    storageDriver.pathExists(jsonFileWithinDynamicPath) ?
        possibleHandlers.push(
            {
                name: 'dynamicSegmentsJsonHandler',
                path: jsonFileWithinDynamicPath,
                nature: 'static',
                pathParams,
                pathParamsMap
            }
        ) : void (0);

    return possibleHandlers;
}

module.exports = getDynamicSegmentsHandlers;
