'use strict';

class EventLogger {

    constructor(eventEmitter) {

        this._eventEmitter = eventEmitter;
    }

    static get LOG_DEBUG_EVENT() {

        return 'log.debug';
    }

    static get LOG_TRACE_EVENT() {

        return 'log.trace';
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

    debug(message) {

        this._eventEmitter.emit(EventLogger.LOG_DEBUG_EVENT, message);
    }

    trace(message) {

        this._eventEmitter.emit(EventLogger.LOG_TRACE_EVENT, message);
    }

    info(message) {

        this._eventEmitter.emit(EventLogger.LOG_INFO_EVENT, message);
    }

    warn(message) {

        this._eventEmitter.emit(EventLogger.LOG_WARN_EVENT, message);
    }

    error(message) {

        this._eventEmitter.emit(EventLogger.LOG_ERROR_EVENT, message);
    }

    fatal(message) {

        this._eventEmitter.emit(EventLogger.LOG_FATAL_EVENT, message);
    }
}

module.exports = EventLogger;
