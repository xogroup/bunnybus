'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    describe('end to end behaviors', () => {

        describe('load test', () => {

            const baseChannelName = 'bunnybus-e2e-load-test';
            const baseQueueName = 'test-e2e-load-test-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const message = { event : 'a.promise', name : 'bunnybus' };
            const pattern = 'a.promise';
            const publishTarget = 1000;

            before(async () => {

                instance = new BunnyBus();
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);

                await Promise.all([
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic'),
                    channelContext.channel.assertQueue(baseQueueName, { durable : false })
                ]);

                await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern);
            });

            afterEach(async () => {

                await instance.unsubscribe(baseQueueName);
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

                for (let i = 0; i < publishTarget; ++i) {
                    promises.push(instance.publish(message));
                }

                await Promise.all(promises);
            });

            it('should consume all mesages within 2 seconds', { timeout: 2000 }, async () => {

                let count = 0;

                const handlers = {};

                const promise = new Promise(async (resolve) => {

                    handlers['a.promise'] = async (msg, ack) => {

                        await ack();

                        if (++count === publishTarget) {
                            resolve();
                        }
                    };
                });

                await instance.subscribe(baseQueueName, handlers, { queue: { durable : false } });

                await promise;
            });
        });
    });
});
