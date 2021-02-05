'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let connectionContext = undefined;
let channelContext = undefined;
let channelManager = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        connectionManager = instance.connections;
        channelManager = instance.channels;
    });

    describe('public methods', () => {
        describe('_ack', () => {
            const baseChannelName = 'bunnybus-ack';
            const baseQueueName = 'test-ack-queue';
            const message = { name: 'bunnybus', event: 'a' };
            const pattern = 'a';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                connectionContext = channelContext.connectionContext;

                await Promise.all([
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic', BunnyBus.DEFAULT_EXCHANGE_CONFIGURATION),
                    channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION),
                    channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern)
                ]);
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);

                await instance.stop();
            });

            it('should ack a message off the queue', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        await instance.publish({ message });
                        const payload = await instance.get({ queue: baseQueueName });

                        await instance._ack({ payload, channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName) });
                        const result = await channelContext.channel.checkQueue(baseQueueName);

                        expect(result.queue).to.be.equal(baseQueueName);
                        expect(result.messageCount).to.be.equal(0);
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        await instance.publish({ message });
                        const payload = await instance.get({ queue: baseQueueName });

                        await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                        await instance._ack({ payload, channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName) });
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should not error when channel does not pre-exist', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        await instance.publish({ message });
                        const payload = await instance.get({ queue: baseQueueName });

                        await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName));

                        await instance._ack({ payload, channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName) });
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
