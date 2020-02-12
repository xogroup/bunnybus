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

    describe('events', () => {

        before(async () => {

            instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            connectionManager = instance.connections;
            channelManager = instance.channels;
        });

        describe('publish', () => {

            const baseChannelName = 'bunnybus-events-publish';
            const baseQueueName = 'test-events-publish-queue';
            const message = { event : 'published-event', name : 'bunnybus' };

            after(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await channelContext.channel.deleteExchange(instance.config.globalExchange);
            });

            it('should emit PUBLISHED_EVENT when message is published', async () => {

                await new Promise(async (resolve) => {

                    instance.once(BunnyBus.PUBLISHED_EVENT, (sentMessage) => {

                        expect(sentMessage).to.include(message);
                        resolve();
                    });

                    await instance.publish(message);
                });
            });
        });
    });
});
