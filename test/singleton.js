'use strict';

const { expect } = require('@hapi/code');

const { describe, it } = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../');

describe('singleton', () => {
    it('should generate an instance of BunnyBus', () => {
        const instance = new BunnyBus();
        expect(instance).to.be.an.instanceof(BunnyBus);
    });

    it('should generate the same instance when instantiated twice', () => {
        const instance1 = new BunnyBus();
        const instance2 = new BunnyBus();
        expect(instance1).to.shallow.equal(instance2);
    });

    it('should configure BunnyBus instance', () => {
        const instance1 = new BunnyBus();
        expect(instance1.config.prefetch).to.equal(
            BunnyBus.Defaults.SERVER_CONFIGURATION.prefetch
        );
        const config = { prefetch: 4 };
        const instance2 = new BunnyBus(config);
        expect(instance1.config.prefetch).to.equal(config.prefetch);
        expect(instance2.config.prefetch).to.equal(config.prefetch);
    });
});
