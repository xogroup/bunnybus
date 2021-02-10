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

    debug(...data) {
        this._eventEmitter.emit(EventLogger.LOG_DEBUG_EVENT, ...data);
    }

    info(...data) {
        this._eventEmitter.emit(EventLogger.LOG_INFO_EVENT, ...data);
    }

    warn(...data) {
        this._eventEmitter.emit(EventLogger.LOG_WARN_EVENT, ...data);
    }

    error(...data) {
        this._eventEmitter.emit(EventLogger.LOG_ERROR_EVENT, ...data);
    }

    fatal(...data) {
        this._eventEmitter.emit(EventLogger.LOG_FATAL_EVENT, ...data);
    }
}

module.exports = EventLogger;
