'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('public methods', () => {
        describe('subscribe / unsubscribe (single queue with # route)', () => {
            const baseChannelName = 'bunnybus-subscribe';
            const baseQueueName1 = 'test-subscribe-queue1';
            const baseQueueName2 = 'test-subscribe-queue2';
            const message = { event: 'a.b', name: 'bunnybus' };

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName1),
                    channelContext.channel.deleteQueue(baseQueueName2)
                ]);
            });

            afterEach(async () => {
                await Promise.all([instance.unsubscribe({ queue: baseQueueName1 }), instance.unsubscribe({ queue: baseQueueName2 })]);
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName1),
                    channelContext.channel.deleteQueue(baseQueueName2)
                ]);

                await instance.stop();
            });

            it('should consume message from two queues and acknowledge off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    let counter = 0;

                    handlers[message.event] = async ({ message: consumedMessage, ack }) => {
                        expect(consumedMessage.name).to.be.equal(message.name);
                        await ack();

                        if (++counter === 2) {
                            resolve();
                        }
                    };

                    await Promise.all([
                        instance.subscribe({ queue: baseQueueName1, handlers }),
                        instance.subscribe({ queue: baseQueueName2, handlers })
                    ]);

                    await instance.publish({ message });
                });
            });
        });
    });
});
