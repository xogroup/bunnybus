'use strict';

const internals = {
    defaults : {
        ssl                : false,
        protocol           : 'amqp://',
        user               : 'guest',
        password           : 'guest',
        server             : 'rabbitbox',
        port               : 5672,
        vhost              : '%2f',
        heartbeat          : 2000,
        autoAcknowledgement: false,
        globalExchange     : 'local-global',
        limit              : 5,
        errorQueue         : 'error-bus',
        silence            : false
    },
    instance : undefined
};

class BunnyBus {

    constructor(config) {

        if (!internals.instance) {
            internals.instance = this;
        }

        if (config) {
            this.config = config;
        }

        return internals.instance;
    }

    get config() {

        return this._config;
    }

    set config(value) {

        this._config = Object.assign(this._config || internals.defaults, value);
    }
}

module.exports = BunnyBus;
