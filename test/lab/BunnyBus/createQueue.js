'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        connectionManager = instance.connections;
        channelManager = instance.channels;
    });

    describe('public methods', () => {
        describe('createQueue', () => {
            const baseChannelName = 'bunnybus-createQueue';
            const baseQueueName = 'test-queue';

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                connectionContext = channelContext.connectionContext;

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            after(async () => {
                await channelContext.channel.deleteQueue(baseQueueName);
                await instance.stop();
            });

            it(`should create a queue with name ${baseQueueName}`, async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result1 = null;

                        const result2 = await instance.createQueue({ name: baseQueueName });

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result1 = err;
                        }

                        expect(result1).to.not.exist();
                        expect(result2).to.exist();
                        expect(result2.queue).to.equal(baseQueueName);
                        expect(result2.messageCount).to.equal(0);
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when creating queue concurrently', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await Promise.all([instance.createQueue(baseQueueName), instance.createQueue({ name: baseQueueName })]);

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.not.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when creating queue sequentially', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.createQueue({ name: baseQueueName });
                        await instance.createQueue({ name: baseQueueName });

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.not.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.createQueue({ name: baseQueueName });

                        try {
                            // removing the connection cancels all channels attached to it.
                            // so we have to reinstate the channel used for this test as well
                            await instance._autoBuildChannelContext({ channelName: baseChannelName });
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.not.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelManager.close(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                await Assertions.autoRecoverChannel(
                    async () => {
                        let result = null;

                        await instance.createQueue({ name: baseQueueName });

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result = err;
                        }

                        expect(result).to.not.exist();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not create a queue when disableQueueCreate === true', async () => {
                instance.config = { disableQueueCreate: true };

                await Assertions.autoRecoverChannel(
                    async () => {
                        let result1 = null;

                        const result2 = await instance.createQueue({ name: baseQueueName });

                        try {
                            await channelContext.channel.checkQueue(baseQueueName);
                        } catch (err) {
                            result1 = err;
                        }

                        expect(result1).to.exist();
                        expect(result2).to.be.undefined();
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
