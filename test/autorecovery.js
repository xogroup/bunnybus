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
        instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
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
                    instance.once(BunnyBus.Events.RECOVERED, () => {
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

    describe('connection', { skip: false }, () => {
        beforeEach(async () => {
            //connect with default settings
            instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
            await instance._autoConnectChannel();
        });

        it(
            'should fire FATAL event after exceeding reconnect attempts',
            { timeout: 5000 },
            async () => {
                await new Promise((resolve) => {
                    instance.once(BunnyBus.Events.FATAL, (error) => {
                        resolve();
                    });

                    //pass fake server
                    instance.config = {
                        password: 'fake',
                        autoRecoveryRetryCount: 2
                    };
                    //force reconnect
                    instance.connection.emit('close', new Error('ay no'));
                });
            }
        );
    });
});
