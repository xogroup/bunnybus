'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;
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
        describe('get', () => {
            const baseChannelName = 'bunnybus-get';
            const baseQueueName = 'test-get-queue';
            const buffer = Buffer.from('hello world');
            const options = {
                headers: {
                    foo: 'bar'
                },
                fields: {
                    fabri: 'kan'
                },
                expiration: new Date().getTime()
            };

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                await channelContext.channel.purgeQueue(baseQueueName);
            });

            after(async () => {
                await channelContext.channel.deleteQueue(baseQueueName);
                await instance.stop();
            });

            it('should receive message', async () => {
                await Assertions.assertGet(instance, channelContext, null, null, buffer, baseQueueName, options);
            });

            it('should not error when connection does not pre-exist', async () => {
                await Assertions.assertGet(
                    instance,
                    channelContext,
                    connectionManager,
                    null,
                    buffer,
                    baseQueueName,
                    options
                );
            });

            it('should not error when channel does not pre-exist', async () => {
                await Assertions.assertGet(
                    instance,
                    channelContext,
                    null,
                    channelManager,
                    buffer,
                    baseQueueName,
                    options
                );
            });
        });
    });
});
