'use strict';

const createConnectionString = function (config) {
    const { protocol, username, password, hostname, port, vhost, heartbeat } = config;

    return `${protocol}://${username}:${password}@${hostname}:${port}/${vhost}?heartbeat=${heartbeat}`;
};

module.exports = createConnectionString;
