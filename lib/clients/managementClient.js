'use strict';

const Request = require('superagent');

class ManagementClient {
    constructor(name, { hostname, port, username, password, vhost, timeout, maxRetryCount } = {}) {
        this._createdAt = Date.now();
        this._name = name;
        this._active = false;
        this._protocolAndHost = undefined;
        this._connectionOptions = { hostname, username, password, vhost, timeout: timeout * 6, maxRetryCount };

        return this;
    }

    get name() {
        return this._name;
    }

    get uniqueName() {
        return `management-client_${this._name}_${this._createdAt}`;
    }

    get connectionOptions() {
        return this._connectionOptions;
    }

    get active() {
        return this._active;
    }

    async initialize() {
        const { hostname, username, password } = this._connectionOptions;

        (
            await Promise.allSettled([
                Request.get(`http://${hostname}:15672/api/overview`)
                    .timeout(1000)
                    .auth(username, password)
                    .then(() => `http://${hostname}:15672`),
                Request.get(`http://${hostname}/api/overview`)
                    .timeout(1000)
                    .auth(username, password)
                    .then(() => `http://${hostname}`),
                Request.get(`https://${hostname}/api/overview`)
                    .timeout(1000)
                    .auth(username, password)
                    .then(() => `https://${hostname}`)
            ])
        ).forEach((protocolAttempt) => {
            if (protocolAttempt.status === 'fulfilled') {
                this._protocolAndHost = protocolAttempt.value;
                this._active = true;
            }
        });
    }

    async getQueue(queue) {
        if (this._active) {
            const { vhost, username, password } = this._connectionOptions;

            const {
                body: { messages: messageCount = 0, consumers: consumerCount = 0 }
            } = await Request.get(`${this._protocolAndHost}/api/queues/${vhost}/${queue}`)
                .auth(username, password)
                .timeout(this.timeout)
                .retry(this.maxRetryCount);

            return { queue, messageCount, consumerCount };
        }
    }
}

module.exports = ManagementClient;
