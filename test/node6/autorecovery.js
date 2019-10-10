'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = (exports.lab = Lab.script());
const before = lab.before;
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../../lib');
let instance = undefined;

describe('automatic recovery cases', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('channel', () => {

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        it('should correctly recover consumers', { timeout: 5000 }, (done) => {

            instance.once(BunnyBus.RECOVERED_EVENT, () => {

                expect(Object.keys(instance.channel.consumers).length).to.be.at.least(1);
                return done();
            });

            instance.subscribe('test-queue', {
                'test-event': (message, ack) => {

                    ack();
                }
            })
                .then( () => {

                    instance.channel.close();
                });
        });
    });
});
