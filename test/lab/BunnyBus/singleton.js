'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('singleton', () => {
    it('should generate an instance of BunnyBus', () => {
        const instance = BunnyBus.Singleton();

        expect(instance).to.be.an.instanceof(BunnyBus);
    });

    it('should override configuration when passed', () => {
        const newConfig = { ...BunnyBus.DEFAULT_SERVER_CONFIGURATION, custom: 'value' };
        const instance = BunnyBus.Singleton(newConfig);

        expect(instance.config).to.contain(newConfig);
    });

    it('should generate the same instance when instantiated twice', () => {
        const instance1 = BunnyBus.Singleton();
        const instance2 = BunnyBus.Singleton();

        expect(instance1).to.shallow.equal(instance2);
    });

    it('should not be the same as a non-singleton instance', () => {
        const instance1 = BunnyBus.Singleton();
        const instance2 = BunnyBus.Singleton();

        const nonSingletonInstance = new BunnyBus();

        expect(instance1).to.shallow.equal(instance2);
        expect(nonSingletonInstance).to.not.shallow.equal(instance1);
    });
});
