'use strict';

const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];

const validateLoggerContract = (logger) =>
    !validLevels.find((level) => typeof logger[level] !== 'function');

module.exports = validateLoggerContract;
