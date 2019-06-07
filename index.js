'use strict';

const BunnyBus = require('./lib');

let instance;
class SingletonBunnyBus extends BunnyBus {
    constructor(config) {
        if (instance) {
            if (config) {
                instance.config = config;
            }

            return instance;
        }

        super();
        instance = this;
    }
}

module.exports = SingletonBunnyBus;
