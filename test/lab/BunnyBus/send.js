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
        describe('send', () => {
            const baseChannelName = 'bunnybus-send';
            const baseQueueName = 'test-send-queue';
            const message = { name: 'bunnybus' };
            const messageWithEvent = { event: 'event1', name: 'bunnybus' };

            beforeEach(async () => {
                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await channelContext.channel.deleteQueue(baseQueueName);
            });

            after(async () => {
                instance._autoBuildChannelContext(baseChannelName);
                await channelContext.channel.deleteQueue(baseQueueName);

                await instance.stop();
            });

            it('should send message', async () => {
                await Assertions.assertSend(instance, channelContext, message, baseQueueName, null, null, null, null);
            });

            it('should send message when miscellaneous amqplib options are included', async () => {
                const amqpOptions = {
                    expiration: '1000',
                    userId: 'guest',
                    CC: 'a',
                    priority: 1,
                    persistent: false,
                    deliveryMode: false,
                    mandatory: false,
                    BCC: 'b',
                    contentType: 'text/plain',
                    contentEncoding: 'text/plain',
                    correlationId: 'some_id',
                    replyTo: 'other_queue',
                    messageId: 'message_id',
                    timestamp: 1555099550198,
                    type: 'some_type',
                    appId: 'test_app'
                };

                await Assertions.assertSend(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    null,
                    null,
                    null,
                    amqpOptions
                );
            });

            it('should proxy `source` when supplied', async () => {
                await Assertions.assertSend(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    null,
                    'someModule',
                    null,
                    null
                );
            });

            it('should proxy `transactionId` when supplied', async () => {
                await Assertions.assertSend(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    'someTransactionId',
                    null,
                    null,
                    null
                );
            });

            it('should proxy `routeKey` when supplied', async () => {
                await Assertions.assertSend(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    null,
                    null,
                    'event1',
                    null
                );
            });

            it('should proxy `routeKey` when supplied', async () => {
                await Assertions.assertSend(
                    instance,
                    channelContext,
                    messageWithEvent,
                    baseQueueName,
                    null,
                    null,
                    null,
                    null
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await Assertions.assertSend(instance, channelContext, message, baseQueueName, null, null, null, null);
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName));

                await Assertions.assertSend(instance, channelContext, message, baseQueueName, null, null, null, null);
            });
        });
    });
});
