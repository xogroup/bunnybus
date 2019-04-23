'use strict';

const { expect } = require('@hapi/code');

const { describe, it } = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

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
});
