'use strict';

class NoConnectionError extends Error {

    constructor(message) {

        super(message || 'no connection found');
        this.name = 'NoConnectionError';
    }
}

module.exports = NoConnectionError;
