'use strict';

class EventLogger {

    constructor(eventEmitter) {

        this._eventEmitter = eventEmitter;
    }

    static get LOG_DEBUG_EVENT() {

        return 'log.debug';
    }

    static get LOG_INFO_EVENT() {

        return 'log.info';
    }

    static get LOG_WARN_EVENT() {

        return 'log.warn';
    }

    static get LOG_ERROR_EVENT() {

        return 'log.error';
    }

    static get LOG_FATAL_EVENT() {

        return 'log.fatal';
    }

    debug(...args) {

        this._eventEmitter.emit(EventLogger.LOG_DEBUG_EVENT, ...args);
    }

    info(...args) {

        this._eventEmitter.emit(EventLogger.LOG_INFO_EVENT, ...args);
    }

    warn(...args) {

        this._eventEmitter.emit(EventLogger.LOG_WARN_EVENT, ...args);
    }

    error(...args) {

        this._eventEmitter.emit(EventLogger.LOG_ERROR_EVENT, ...args);
    }

    fatal(...args) {

        this._eventEmitter.emit(EventLogger.LOG_FATAL_EVENT, ...args);
    }
}

module.exports = EventLogger;
