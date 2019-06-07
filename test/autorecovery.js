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
    describe('channel', () => {
        beforeEach(async () => {
            instance = new BunnyBus();
            await instance.connect();
        });

        it('should correctly recover consumers', async () => {
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
        });

        it(
            'should fire FATAL event after exceeding channel attempts',
            { timeout: 5000 },
            async () => {
                await new Promise((resolve) => {
                    let retryCount = 0;
                    instance.on(BunnyBus.Events.RECOVERING, () => retryCount++);
                    instance.once(BunnyBus.Events.FATAL, () => {
                        expect(retryCount).to.equal(
                            BunnyBus.Defaults.SERVER_CONFIGURATION
                                .autoRecoveryRetryCount
                        );
                        resolve();
                    });

                    //invalid config
                    instance.config = { port: 1234 };
                    //force close
                    instance.connection.emit('close');
                });
            }
        );
    });

    describe('events', () => {
        describe('recovering', () => {
            beforeEach(async () => {
                instance = new BunnyBus();
                await instance.connect();
            });

            it(
                'should be evented when connection was closed and is recovering',
                { timeout: 5000 },
                async () => {
                    await new Promise((resolve) => {
                        instance.once(BunnyBus.Events.RECOVERING, resolve);
                        instance.connection.emit('close');
                    });
                }
            );

            it(
                'should be evented when channel was closed and is recovering',
                { timeout: 5000 },
                async () => {
                    await new Promise((resolve) => {
                        instance.once(BunnyBus.Events.RECOVERING, resolve);
                        instance.channel.emit('close');
                    });
                }
            );
        });

        describe('recovered', () => {
            beforeEach(async () => {
                instance = new BunnyBus();
                await instance.connect();
            });

            it(
                'should be evented when connection was closed and is recovering',
                { timeout: 5000 },
                async () => {
                    await new Promise((resolve) => {
                        instance.once(BunnyBus.Events.RECOVERED, () => {
                            expect(instance.connection).to.exist();
                            expect(instance.channel).to.exist();
                            resolve();
                        });
                        instance.connection.emit('close');
                    });
                }
            );

            it(
                'should be evented when channel was closed and is recovering',
                { timeout: 5000 },
                async () => {
                    await new Promise((resolve) => {
                        instance.once(BunnyBus.Events.RECOVERED, () => {
                            expect(instance.connection).to.exist();
                            expect(instance.channel).to.exist();
                            resolve();
                        });
                        instance.channel.emit('close');
                    });
                }
            );
        });
    });

    describe('exchange', () => {
        beforeEach(async () => {
            instance = new BunnyBus();
            await instance.connect();
        });

        it('should recover from a non existent exchange', async () => {
            await new Promise(async (resolve) => {
                instance.once(BunnyBus.Events.RECOVERED, resolve);
                await expect(instance.checkExchange('ay no')).to.reject();
            });
        });
    });

    describe('publish', () => {
        before(async () => {
            instance = new BunnyBus();
            await instance._closeConnection();
        });

        it('should fail when server host configuration value is not valid', async () => {
            const message = { event: 'eb', name: 'bunnybus' };
            //inject bad config
            instance.config = { server: 'fake' };
            //this should fail
            await expect(instance.publish(message)).to.reject();

            //restore config
            instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
            await instance.publish(message);
        });
    });
});
