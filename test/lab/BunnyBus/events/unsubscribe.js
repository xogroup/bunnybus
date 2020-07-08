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

        describe('unsubscribe', () => {
            const baseChannelName = 'bunnybus-events-unsubscribe';
            const baseQueueName = 'test-events-unsubscribe-queue';

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
            });

            beforeEach(async () => {
                const handlers = {};
                handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};

                await instance.subscribe({ queue: baseQueueName, handlers });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);

                await instance.stop();
            });

            it('should emit UNSUBSCRIBED_EVENT when consume handlers are setup', async () => {
                await new Promise(async (resolve) => {
                    instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {
                        expect(queue).to.equal(baseQueueName);

                        resolve();
                    });

                    await instance.unsubscribe({ queue: baseQueueName });
                });
            });
        });
    });
});
