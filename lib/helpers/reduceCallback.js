'use strict';

const reduceCallback = function () {

    for (let i = 0; i < arguments.length; ++i) {
        if (typeof arguments[i] === 'function') {
            return arguments[i];
        }
    }

    return () => {};
};

module.exports = reduceCallback;
