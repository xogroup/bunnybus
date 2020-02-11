'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../../lib');
const Events = require('../../../../lib/events');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
const expect = Code.expect;

let instance = undefined;
let connectionManager = undefined;
let connectionContext = undefined;
let channelManager = undefined;
let channelContext = undefined;

describe('BunnyBus', () => {

    describe('end to end behaviors', () => {

        describe('edge cases', () => {

            const baseChannelName = 'bunnybus-e2e-edge-cases';
            const baseQueueName = 'test-e2e-queue';

            beforeEach(async () => {

                instance = new BunnyBus();
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                connectionManager = instance.connections;
                channelManager = instance.channels;

                channelContext = await instance._autoBuildChannelContext(baseChannelName);
                connectionContext = channelContext.connectionContext;

                connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await new Promise((resolve) => {

                    channelContext
                        .removeAllListeners(Events.AMQP_CHANNEL_CLOSE_EVENT)
                        .once(Events.AMQP_CHANNEL_CLOSE_EVENT, resolve);
                });
            });

            it('should pass when parallel calls to publish happens when connection starts off closed', async () => {

                const message = { event : 'ee', name : 'bunnybus' };

                await Promise.all([
                    instance.publish(message),
                    instance.publish(message),
                    instance.publish(message)
                ]);
            });

            it('should pass when send pushes a message to a subscribed queue', async () => {

                const message = { event : 'ea', name : 'bunnybus' };

                await new Promise(async (resolve) => {

                    const handlers = {
                        ea : async (subscribedMessaged, ack) => {

                            expect(subscribedMessaged).to.be.equal(message);

                            await ack(resolve);
                            await instance.deleteQueue(baseQueueName);
                            resolve();
                        }
                    };

                    await instance.createQueue(baseQueueName);
                    await instance.send(message, baseQueueName);
                    await instance.subscribe(baseQueueName, handlers);
                });
            });

            it('should error when server host configuration value is not valid', async () => {

                let result = null;

                const message = { event : 'eb', name : 'bunnybus' };
                instance.config = { hostname : 'fake' };

                try {
                    await instance.publish(message);
                }
                catch (err) {
                    result = err;

                    connectionManager.remove(BunnyBus.DEFAULT_CONNECTION_NAME);

                    await new Promise((resolve) => {

                        channelManager.once(Events.CHANNEL_MANAGER_REMOVED, resolve);
                    });
                }

                expect(result).to.exist();
            });
        });
    });
});
