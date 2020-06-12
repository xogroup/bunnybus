'use strict';

class NoConnectionError extends Error {
    constructor() {
        super('no connection found');
        this.name = 'NoConnectionError';
    }
}

module.exports = NoConnectionError;
