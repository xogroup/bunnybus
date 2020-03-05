'use strict';

const createConnectionString = function (config) {

    return `${config.protocol}://${config.username}:${config.password}@${config.hostname}:${config.port}/${config.vhost}?heartbeat=${config.heartbeat}`;
};

module.exports = createConnectionString;
