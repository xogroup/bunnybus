'use strict';

const delay = (timeout) => {
    return new Promise((resolve) => setTimeout(resolve, timeout));
};

const loop = async ({ condition, exec }) => {
    while (condition()) {
        try {
            await exec();
        }
        catch (error) {
            throw error;
        }
    }
};

module.exports = {
    defaultConfiguration: require('./defaultConfiguration'),
    createConnectionString: require('./createConnectionString'),
    convertToBuffer: require('./convertToBuffer'),
    createTransactionId: require('./createTransactionId'),
    exponentialBackoff: require('./exponentialBackoff'),
    getPackageData: require('./getPackageData'),
    isMajorCompatible: require('./isMajorCompatible'),
    cleanObject: require('./cleanObject'),
    parsePayload: require('./parsePayload'),
    reduceRouteKey: require('./reduceRouteKey'),
    validateLoggerContract: require('./validateLoggerContract'),
    routeMatcher: require('./routeMatcher'),
    handlerMatcher: require('./handlerMatcher'),
    buildPublishSendOptions: require('./buildPublishSendOptions'),
    delay,
    loop
};
