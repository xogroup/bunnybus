'use strict';
module.exports = ({ protocol, username, password, hostname, port, vhost, heartbeat }) => `${protocol}://${username}:${password}@${hostname}:${port}/${vhost}?heartbeat=${heartbeat}`;
