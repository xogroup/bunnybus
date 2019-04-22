'use strict';

const { expect } = require('@hapi/code');
const Sinon = require('sinon');

const {
    after,
    before,
    beforeEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());

const BunnyBus = require('../lib');

let instance;

describe('automatic recovery cases', { skip: false }, () => {
    beforeEach(() => {
        instance = new BunnyBus();
        instance.config = { autoRecovery: true, autoRecoveryRetryCount: 3 };
    });

    describe('channel', () => {
        beforeEach(async () => {
            await instance._autoConnectChannel();
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
            { timeout: 5000, skip: true },
            async () => {
                await new Promise(async (resolve) => {
                    const stub = Sinon.stub(instance, '_createChannel').rejects(
                        Error('ay no')
                    );

                    instance.once(BunnyBus.Events.FATAL, (error) => {
                        expect(stub.calledThrice).to.be.true();
                        stub.reset();
                        Sinon.reset();
                        resolve();
                    });

                    //force reconnect
                    instance.channel.emit('close');
                });
            }
        );
    });

    describe('events', () => {
        describe('recovering', () => {
            beforeEach(async () => {
                await instance._autoConnectChannel();
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
                await instance._autoConnectChannel();
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
        before(async () => {
            await instance._autoConnectChannel();
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
            await instance._closeConnection();
        });

        it(
            'should pass when server host configuration value is not valid',
            { timeout: 5000, skip: true },
            async () => {
                await new Promise(async (resolve) => {
                    const message = { event: 'eb', name: 'bunnybus' };

                    instance.once(BunnyBus.Events.FATAL, async () => {
                        //reset config
                        instance.config = {
                            server:
                                BunnyBus.Defaults.SERVER_CONFIGURATION.server
                        };

                        //this should pass
                        await instance.publish(message);

                        resolve();
                    });

                    //inject bad config
                    instance.config = { server: 'fake' };
                    //this should fail
                    await expect(instance.publish(message)).to.reject();
                });
            }
        );
    });
});
