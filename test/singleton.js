'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');

describe('singleton', () => {

    it('should generate an instance of BunnyBus', (done) => {

        const instance = new BunnyBus();

        expect(instance).to.be.an.instanceof(BunnyBus);
        done();
    });

    it('should generate the same instance when instantiated twice', (done) => {

        const instance1 = new BunnyBus();
        const instance2 = new BunnyBus();

        expect(instance1).to.be.equal(instance2);
        done();
    });
});
