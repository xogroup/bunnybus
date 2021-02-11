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
        describe('getAll', () => {
            const baseChannelName = 'bunnybus-getAll';
            const baseQueueName = 'test-getAll-queue';
            const message = { name: 'bunnybus' };

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION);
                await channelContext.channel.purgeQueue(baseQueueName);
            });

            after(async () => {
                await instance._autoBuildChannelContext({ channelName: baseChannelName });
                await channelContext.channel.deleteQueue(baseQueueName);
                await instance.stop();
            });

            it('should retrieve all message', async () => {
                await Assertions.assertGetAll(instance, channelContext, null, null, message, baseQueueName, 10);
            });

            it('should not error when connection does not pre-exist', async () => {
                await Assertions.assertGetAll(instance, channelContext, connectionManager, null, message, baseQueueName, 10);
            });

            it('should not error when channel does not pre-exist', async () => {
                await Assertions.assertGetAll(instance, channelContext, null, channelManager, message, baseQueueName, 10);
            });
        });
    });
});
