'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Sinon = require('sinon');
const BunnyBus = require('../../../../lib');
const Exceptions = require('../../../../lib/exceptions');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let stubs = [];
let connectionManager = undefined;
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
        describe('connection and channel failure tests', () => {
            const baseChannelName = 'bunnybus-negative-tests';
            const baseQueueName = 'test-negative-tests-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const consumerTag = 'abcde12345';
            const handlers = { event1: () => {} };

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
            });

            after(async () => {
                await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await instance.stop();
            });

            it('should throw SubscriptionExistError when calling subscribe on an active subscription exist', async () => {
                let result = null;

                instance.subscriptions.create(baseQueueName, handlers);
                instance.subscriptions.tag(baseQueueName, consumerTag);

                try {
                    await instance.subscribe({ queue: baseQueueName, handlers });
                } catch (err) {
                    result = err;
                }

                expect(result).to.be.an.error(Exceptions.SubscriptionExistError);
            });

            it('should throw SubscriptionBlockedError when calling subscribe against a blocked queue', async () => {
                let result = null;

                instance.subscriptions.block(baseQueueName);

                try {
                    await instance.subscribe({ queue: baseQueueName, handlers });
                } catch (err) {
                    result = err;
                }

                expect(result).to.be.an.error(Exceptions.SubscriptionBlockedError);
            });

            it('should not error when connection does not pre-exist', async () => {
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await instance.subscribe({ queue: baseQueueName, handlers });
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName));

                await instance.subscribe({ queue: baseQueueName, handlers });
            });
        });

        describe('connection recovery failure tests', () => {
            const baseChannelName = 'bunnybus-recovery-failure';
            const baseQueueName = 'test-recovery-queue';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
            });

            after(() => {
                for (const stub of stubs) {
                    stub.restore();
                }
            });

            it('should be unhealthy after recovery fails', async () => {
                const handlers = {};

                // Subscribe to an arbitrary queue

                await instance.subscribe({ queue: baseQueueName, handlers });

                // Inject some faults into the Manager objects

                stubs = [Sinon.stub(instance.connections, 'create').rejects(), Sinon.stub(instance.channels, 'create').rejects()];

                // Force a failure and attempt at reconnection

                const failurePromise = new Promise((resolve) => {
                    instance.on(BunnyBus.RECOVERY_FAILED_EVENT, resolve);
                });

                await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName));
                await failurePromise;

                // Validate health check

                const result = instance.healthy;

                expect(result).to.be.false();
            });
        });
    });
});
