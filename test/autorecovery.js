'use strict';

const { expect } = require('@hapi/code');

const {
    before,
    beforeEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

let instance;

describe('automatic recovery cases', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('channel', () => {
        beforeEach(async () => {
            await instance._autoConnectChannel();
        });

        it(
            'should correctly recover consumers',
            { timeout: 5000 },
            async () => {
                await new Promise(async (resolve) => {
                    instance.once(BunnyBus.RECOVERED_EVENT, () => {
                        expect(
                            Object.keys(instance.channel.consumers).length
                        ).to.be.at.least(1);
                        resolve();
                    });

                    await instance.subscribe('test-queue', {
                        'test-event': async (message, ack) => {
                            await ack();
                        }
                    });

                    await instance.channel.close();
                });
            }
        );
    });
});
