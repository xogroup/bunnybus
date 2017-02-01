'use strict';

const reduceCallback = function (...args) {

    let returnValue;

    for (let i = 0; i < args.length; ++i) {
        if (typeof args[i] === 'function') {
            returnValue = args[i];
            break;
        }
        else if (returnValue === undefined && typeof args[i] === 'object') {
            returnValue = () => {};
        }
    }

    return returnValue;
};

module.exports = reduceCallback;
