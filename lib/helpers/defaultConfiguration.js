'use strict';

module.exports = {
    server: {
        protocol: 'amqp',
        hostname: '127.0.0.1',
        port: 5672,
        username: 'guest',
        password: 'guest',
        locale: 'en_US',
        heartbeat: 2000,
        vhost: '%2f',
        timeout: 2000,
        connectionRetryCount: 10,
        globalExchange: 'default-exchange',
        prefetch: 5,
        errorQueue: 'error-bus',
        silence: false,
        maxRetryCount: 10,
        validatePublisher: false,
        validateVersion: false,
        normalizeMessages: false,
        dispatchType: 'concurrent',
        rejectUnroutedMessages: false,
        disableQueueBind: false
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
