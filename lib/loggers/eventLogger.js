'use strict';

class EventLogger {

    constructor(eventEmitter) {

        this._eventEmitter = eventEmitter;
    }

    debug(message) {

        this._eventEmitter.emit('log.debug', message);
    }

    info(message) {

        this._eventEmitter.emit('log.info', message);
    }

    warn(message) {

        this._eventEmitter.emit('log.warn', message);
    }

    error(message) {

        this._eventEmitter.emit('log.error', message);
    }

    fatal(message) {

        this._eventEmitter.emit('log.fatal', message);
    }
}

module.exports = EventLogger;
