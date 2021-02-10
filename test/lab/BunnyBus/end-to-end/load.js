'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    describe('end to end behaviors', () => {
        describe('load test with serial dispatcher', () => {
            const baseChannelName = 'bunnybus-e2e-load-serial-test';
            const baseQueueName = 'test-e2e-load-serial-test-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const message = { event: 'a.promise', name: 'bunnybus' };
            const pattern = 'a.promise';
            const publishTarget = 300;

            before(async () => {
                instance = new BunnyBus();
                instance.config = Object.assign({}, BunnyBus.DEFAULT_SERVER_CONFIGURATION, { dispatchType: 'serial' });
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await Promise.all([
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic'),
                    channelContext.channel.assertQueue(baseQueueName, { durable: false })
                ]);

                await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await instance.stop();
            });

            it('should publish all messages within 3 seconds', { timeout: 3000 }, async () => {
                const promises = [];

                // Do this to prime the connection
                await instance.publish({ message });

                for (let i = 0; i < publishTarget; ++i) {
                    promises.push(instance.publish({ message }));
                }

                await Promise.all(promises);
            });

            it('should consume all messages within 5 seconds', { timeout: 5000 }, async () => {
                let count = 0;

                const handlers = {};

                const promise = new Promise(async (resolve) => {
                    handlers['a.promise'] = async ({ ack }) => {
                        await ack();

                        if (++count === publishTarget) {
                            resolve();
                        }
                    };
                });

                await instance.subscribe({
                    queue: baseQueueName,
                    handlers,
                    options: {
                        queue: { durable: false }
                    }
                });

                await promise;
            });
        });

        describe('load test with partitioned serial dispatcher', () => {
            const baseChannelName = 'bunnybus-e2e-load-partitioned-serial-test';
            const baseQueueName = 'test-e2e-load-partitioned-serial-test-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const message = { event: 'a.promise', name: 'bunnybus' };
            const pattern = 'a.promise';
            const partitionKeySelector = '{message.serialNumber}';
            const partitionCount = 10;
            const publishTarget = 300;

            before(async () => {
                instance = new BunnyBus();
                instance.config = Object.assign({}, BunnyBus.DEFAULT_SERVER_CONFIGURATION, {
                    dispatchType: 'partitionSerial',
                    serialDispatchPartitionKeySelectors: [partitionKeySelector]
                });
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await Promise.all([
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic'),
                    channelContext.channel.assertQueue(baseQueueName, { durable: false })
                ]);

                await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await instance.stop();
            });

            it('should publish all messages within 3 seconds', { timeout: 3000 }, async () => {
                const promises = [];

                // Do this to prime the connection
                await instance.publish({ message });

                for (let i = 0; i < publishTarget; ++i) {
                    promises.push(instance.publish({ message: { ...message, serialNumber: `${i % partitionCount}` } }));
                }

                await Promise.all(promises);
            });

            it('should consume all messages within 5 seconds', { timeout: 5000 }, async () => {
                let count = 0;

                const handlers = {};

                const promise = new Promise(async (resolve) => {
                    handlers['a.promise'] = async ({ ack }) => {
                        await ack();

                        if (++count === publishTarget) {
                            resolve();
                        }
                    };
                });

                await instance.subscribe({
                    queue: baseQueueName,
                    handlers,
                    options: {
                        queue: { durable: false }
                    }
                });

                await promise;
            });
        });

        describe('load test with concurrent dispatcher', () => {
            const baseChannelName = 'bunnybus-e2e-load-concurrent-test';
            const baseQueueName = 'test-e2e-load-concurrent-test-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const message = { event: 'a.promise', name: 'bunnybus' };
            const pattern = 'a.promise';
            const publishTarget = 300;

            before(async () => {
                instance = new BunnyBus();
                instance.config = Object.assign({}, BunnyBus.DEFAULT_SERVER_CONFIGURATION, {
                    dispatchType: 'concurrent'
                });
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await Promise.all([
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic'),
                    channelContext.channel.assertQueue(baseQueueName, { durable: false })
                ]);

                await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            it('should publish all messages within 3 seconds', { timeout: 3000 }, async () => {
                const promises = [];

                // Do this to primse the connection
                await instance.publish({ message });

                for (let i = 0; i < publishTarget; ++i) {
                    promises.push(instance.publish({ message }));
                }

                await Promise.all(promises);
            });

            it('should consume all mesages within 1 seconds', { timeout: 1000 }, async () => {
                let count = 0;

                const handlers = {};

                const promise = new Promise(async (resolve) => {
                    handlers['a.promise'] = async ({ ack }) => {
                        await ack();

                        if (++count === publishTarget) {
                            resolve();
                        }
                    };
                });

                await instance.subscribe({
                    queue: baseQueueName,
                    handlers,
                    options: {
                        queue: { durable: false }
                    }
                });

                await promise;
            });
        });
    });
});
