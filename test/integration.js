'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const before = lab.before;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');
let instance = undefined;

describe('integration', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_CONFIGURATION;
        done();
    });

    it('should connect with default values', (done) => {

        instance.connect((err) => {

            expect(err).to.be.null();
            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
            done();
        });
    });
});

