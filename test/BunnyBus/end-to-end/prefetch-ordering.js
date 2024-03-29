'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    describe('end to end behaviors', () => {

        describe('prefetch-ordering', () => {

            const baseChannelName = 'bunnybus-e2e-prefetch-ordering-test';
            const baseQueueName = 'test-e2e-prefetch-ordering-test-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const message = { event: 'e2e.prefetch-ordering', name: 'bunnybus' };
            const pattern = 'e2e.prefetch-ordering';
            const publishTarget = 200;

            before(async () => {

                instance = new BunnyBus();
                instance.config = Object.assign({}, BunnyBus.DEFAULT_SERVER_CONFIGURATION, { prefetch: 1 });
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
                    channelContext.channel.assertQueue(baseQueueName, { durable: false })
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

            it('should publish and consume all messages in sequence when handler exhibit different timing lengths', { timeout: 20000 }, async () => {

                let counter = 0;
                const randomNumber = (min = 20, max = 80) => Math.floor(Math.random() * (max - min + 1) + min);
                const handlers = {};

                for (let i = 0; i < publishTarget; ++i) {
                    await instance.publish(Object.assign({}, message, { number: i }));
                }

                const promise = new Promise(async (resolve, reject) => {

                    handlers[pattern] = async (msg, ack) => {

                        const waitTimeInMs  = randomNumber();
                        await new Promise((handlerResolve) => setTimeout(handlerResolve, waitTimeInMs));

                        await ack();

                        if (counter++ !== msg.number) {
                            reject(new Error('Messages are out of order'));
                        }

                        if (counter === publishTarget - 1) {
                            resolve();
                        }
                    };
                });

                await instance.subscribe(baseQueueName, handlers, { queue: { durable: false } });

                await promise;
            });
        });
    });
});
