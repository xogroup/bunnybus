'use strict';

const createConnectionString = function (config) {

    const protocol = config.ssl ? 'amqps://' : 'amqp://';

    return protocol +
        config.user + ':' + config.password +
        '@' + config.server + ':' + config.port +
        '/' + config.vhost +
        '?heartbeat=' + config.heartbeat;
};

module.exports = createConnectionString;
