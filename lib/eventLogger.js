'use strict';

class EventLogger {
    constructor(eventEmitter) {
        this._eventEmitter = eventEmitter;
    }

    static get Events() {
        return {
            DEBUG: 'log.debug',
            TRACE: 'log.trace',
            INFO: 'log.info',
            WARN: 'log.warn',
            ERROR: 'log.error',
            FATAL: 'log.fatal'
        };
    }

    debug(message) {
        this._eventEmitter.emit(EventLogger.Events.DEBUG, message);
    }

    trace(message) {
        this._eventEmitter.emit(EventLogger.Events.TRACE, message);
    }

    info(message) {
        this._eventEmitter.emit(EventLogger.Events.INFO, message);
    }

    warn(message) {
        this._eventEmitter.emit(EventLogger.Events.WARN, message);
    }

    error(message) {
        this._eventEmitter.emit(EventLogger.Events.ERROR, message);
    }

    fatal(message) {
        this._eventEmitter.emit(EventLogger.Events.FATAL, message);
    }
}

module.exports = EventLogger;
