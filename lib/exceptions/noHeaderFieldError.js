'use strict';

class NoHeaderFieldError extends Error {

    constructor(message) {

        super(message || 'message is missing headers');
        this.name = 'NoHeaderFieldError';
    }
}

module.exports = NoHeaderFieldError;
