'use strict';

const reduceCallback = (...args) => {

    for (let i = 0; i < args.length; ++i) {
        if (typeof args[i] === 'function') {
            return args[i];
        }
    }
};

module.exports = reduceCallback;
