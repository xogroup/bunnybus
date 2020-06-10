'use strict';

class IncompatibleLoggerError extends Error {
    constructor() {
        super('logger is incompatible');
        this.name = 'InconpatibleLoggerError';
    }
}

module.exports = IncompatibleLoggerError;
