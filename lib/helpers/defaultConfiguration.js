'use strict';

module.exports = {
    server: {
        ssl: false,
        user: 'guest',
        password: 'guest',
        server: '127.0.0.1',
        port: 5672,
        vhost: '%2f',
        //set it to 1 min
        heartbeat: 60,
        autoAcknowledgement: false,
        globalExchange: 'default-exchange',
        prefetch: 5,
        errorQueue: 'error-bus',
        maxRetryCount: 10,
        validatePublisher: false,
        validateVersion: false,
        autoRecovery: true,
        autoRecoveryRetryCount: 3
    },
    queue: {
        exclusive: false,
        durable: true,
        autoDelete: false,
        arguments: []
    },
    exchange: {
        durable: true,
        internal: false,
        autoDelete: false,
        alternateExchange: null,
        arguments: []
    }
};
