'use strict';

const { ManagementClient } = require('../clients');

class HttpClientManager {
    constructor() {
        this._clients = new Map();

        return this;
    }

    async create(name, connectionOptions) {
        if (!connectionOptions) {
            throw new Error('Expected connectionOptions to be supplied');
        }

        const isNew = !this._clients.has(name);

        const clientContext = !isNew ? this._clients.get(name) : new ManagementClient(name, connectionOptions);

        if (clientContext.active) {
            return clientContext;
        }

        if (isNew) {
            this._clients.set(name, clientContext);
            await clientContext.initialize();
        }

        return clientContext.active ? clientContext : undefined;
    }

    contains(name) {
        return this._clients.has(name);
    }

    get(name) {
        return this._clients.get(name);
    }

    list() {
        const results = [];

        for (const [name, context] of this._clients) {
            results.push(context);
        }

        return results;
    }
}

module.exports = HttpClientManager;
