'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {});

    describe('public methods', () => {
        describe('checkQueue', () => {
            const baseChannelName = 'bunnybus-checkQueue';
            const baseQueueName = 'test-queue';

            describe('using AMQP protocol', () => {
                beforeEach(async () => {
                    instance = new BunnyBus();

                    // This is to force us down the amqplib path
                    instance.httpClients.create(BunnyBus.DEFAULT_HTTP_CLIENT_NAME, {
                        ...instance.config,
                        ...{ password: 'badPassword' }
                    });

                    instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                    connectionManager = instance.connections;
                    channelManager = instance.channels;

                    channelContext = await instance._autoBuildChannelContext(baseChannelName);
                    connectionContext = channelContext.connectionContext;

                    await channelContext.channel.deleteQueue(baseQueueName);
                });

                after(async () => {
                    await channelContext.channel.deleteQueue(baseQueueName);
                    await instance.stop();
                });

                it('should be undefined when queue does not exist', async () => {
                    await Assertions.autoRecoverChannel(
                        async () => {
                            const result1 = await instance.checkQueue(baseQueueName);
                            const result2 = instance.channels.get(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                            expect(result1).to.be.undefined();
                            expect(result2.channel).to.exist();
                        },
                        connectionContext,
                        channelContext,
                        channelManager
                    );
                });

                it('should return queue info when queue does exist', async () => {
                    await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);

                    await Assertions.autoRecoverChannel(
                        async () => {
                            const result = await instance.checkQueue(baseQueueName);

                            expect(result).to.exist().and.to.be.an.object().and.to.contain({
                                queue: baseQueueName,
                                messageCount: 0,
                                consumerCount: 0
                            });
                        },
                        connectionContext,
                        channelContext,
                        channelManager
                    );
                });

                it('should not error when connection does not pre-exist', async () => {
                    await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                    await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                    await Assertions.autoRecoverChannel(
                        async () => {
                            await expect(instance.checkQueue(baseQueueName)).to.not.reject();
                        },
                        connectionContext,
                        channelContext,
                        channelManager
                    );
                });

                it('should not error when channel does not pre-exist', async () => {
                    await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                    await channelManager.close(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                    await Assertions.autoRecoverChannel(
                        async () => {
                            await expect(instance.checkQueue(baseQueueName)).to.not.reject();
                        },
                        connectionContext,
                        channelContext,
                        channelManager
                    );
                });
            });

            describe('using HTTP protocol', () => {
                beforeEach(async () => {
                    instance = new BunnyBus();

                    instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                    connectionManager = instance.connections;
                    channelManager = instance.channels;

                    channelContext = await instance._autoBuildChannelContext(baseChannelName);
                    connectionContext = channelContext.connectionContext;

                    await channelContext.channel.deleteQueue(baseQueueName);
                });

                after(async () => {
                    await channelContext.channel.deleteQueue(baseQueueName);
                });

                it('should be undefined when queue does not exist', async () => {
                    const result1 = await instance.checkQueue(baseQueueName);
                    const result2 = instance.channels.get(BunnyBus.MANAGEMENT_CHANNEL_NAME());

                    expect(result1).to.be.undefined();
                    expect(result2).to.be.undefined();
                });

                it('should return queue info when queue does exist', async () => {
                    await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);

                    const result = await instance.checkQueue(baseQueueName);

                    expect(result).to.exist().and.to.be.an.object().and.to.contain({
                        queue: baseQueueName,
                        messageCount: 0,
                        consumerCount: 0
                    });
                });
            });
        });
    });
});
