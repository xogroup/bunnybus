'use strict';

const Code = require('code');
const Lab = require('lab');
const Promisify = require('../promisify');

const lab = (exports.lab = Lab.script());
const before = lab.before;
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../../lib');

let instance = undefined;

describe('automatic recovery cases', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('channel', () => {

        beforeEach(async () => {

            return Promisify(instance._autoConnectChannel);
        });

        it('should correctly recover consumers', { timeout: 5000 }, async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

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
});
