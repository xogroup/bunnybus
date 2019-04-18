'use strict';

const createConnectionString = (config) => {
    const { ssl, user, password, server, port, vhost, heartbeat } = config;

    const useSsl = ssl ? 's' : '';
    const protocol = `amqp${useSsl}://`;

    return `${protocol}${user}:${password}@${server}:${port}/${vhost}?heartbeat=${heartbeat}`;
};

module.exports = createConnectionString;
