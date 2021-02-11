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
        describe('_reject', () => {
            const baseChannelName = 'bunnybus-reject';
            const baseQueueName = 'test-reject-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
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

            beforeEach(async () => {
                await channelContext.channel.purgeQueue(baseQueueName);
                await channelContext.channel.deleteQueue(baseErrorQueueName);
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
                await instance.stop();
            });

            it('should reject a message off the queue', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        await instance.publish({ message });
                        const payload = await instance.get({ queue: baseQueueName });
                        await instance._reject({
                            payload,
                            channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName),
                            errorQueue: baseErrorQueueName
                        });
                        const result = await channelContext.channel.checkQueue(baseErrorQueueName);

                        expect(result.queue).to.be.equal(baseErrorQueueName);
                        expect(result.messageCount).to.be.equal(1);
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });

            it('should reject with well formed header properties', async () => {
                const publishOptions = {
                    source: 'test'
                };
                const requeuedAt = new Date().toISOString();
                const retryCount = 5;
                let transactionId = null;
                let createdAt = null;
                let payload = null;

                await instance.publish({ message, options: publishOptions });
                payload = await instance.get({ queue: baseQueueName });

                transactionId = payload.properties.headers.transactionId;
                createdAt = payload.properties.headers.createdAt;
                payload.properties.headers.requeuedAt = requeuedAt;
                payload.properties.headers.retryCount = retryCount;

                await instance._reject({
                    payload,
                    channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName),
                    errorQueue: baseErrorQueueName
                });

                payload = await instance.get({ queue: baseErrorQueueName });

                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
                expect(payload.properties.headers.createdAt).to.be.equal(createdAt);
                expect(payload.properties.headers.source).to.be.equal(publishOptions.source);
                expect(payload.properties.headers.requeuedAt).to.be.equal(requeuedAt);
                expect(payload.properties.headers.retryCount).to.be.equal(retryCount);
                expect(payload.properties.headers.erroredAt).to.exist();
                expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../../package.json').version);
            });

            it('should not error when connection does not pre-exist', async () => {
                await Assertions.autoRecoverChannel(
                    async () => {
                        await instance.publish({ message });
                        const payload = await instance.get({ queue: baseQueueName });

                        await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                        await instance._reject({
                            payload,
                            channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName),
                            errorQueue: baseErrorQueueName
                        });
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

                        await instance._reject({
                            payload,
                            channelName: BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName),
                            errorQueue: baseErrorQueueName
                        });
                    },
                    connectionContext,
                    channelContext,
                    channelManager
                );
            });
        });
    });
});
