'use strict';

const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];

const validateLoggerContract = (logger) => {
    for (const level of validLevels) {
        if (typeof logger[level] !== 'function') {
            return false;
        }
    }

    return true;
};

module.exports = validateLoggerContract;
