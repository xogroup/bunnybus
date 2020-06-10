'use strict';

class ConcurrentDispatcher {
    constructor() {}

    push(_, delegate) {
        delegate();
    }
}

module.exports = ConcurrentDispatcher;
