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
    describe('events', () => {
        before(async () => {
            instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = instance.connections;
            channelManager = instance.channels;
        });

        describe('subscribe', () => {
            const baseChannelName = 'bunnybus-events-subscribe';
            const baseQueueName = 'test-events-subscribe-queue';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);

                await instance.stop();
            });

            afterEach(async () => {
                await channelContext.channel.cancel(instance.subscriptions.get(baseQueueName).consumerTag);

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
            });

            it('should emit SUBSCRIBED_EVENT when consume handlers are setup', async () => {
                const handlers = {};
                handlers['subscribed-event'] = () => {};

                await new Promise(async (resolve) => {
                    instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {
                        expect(queue).to.be.equal(baseQueueName);
                        resolve();
                    });

                    await instance.subscribe({ queue: baseQueueName, handlers });
                });
            });
        });
    });
});
