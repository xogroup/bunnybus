'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

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
