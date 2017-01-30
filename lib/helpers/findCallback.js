'use strict';

const findCallback = function () {

    for (let i = 0; i < arguments.length; ++i) {
        if (typeof arguments[i] === 'function') {
            return arguments[i];
        }
    }

    return undefined;
};

module.exports = findCallback;
