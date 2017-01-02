'use strict';

class NoChannelError extends Error {

    constructor(message) {

        super(message || 'no channel found');
        this.name = 'NoChannelError';
    }
}

module.exports = NoChannelError;
