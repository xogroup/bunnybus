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
        connectionManager = instance.connections;
        channelManager = instance.channels;
    });

    describe('public methods', () => {
        describe('publish', () => {
            const baseChannelName = 'bunnybus-publish';
            const baseQueueName = 'test-publish-queue';
            const message = { name: 'bunnybus' };
            const patterns = ['a', 'a.b', 'b', 'b.b', 'z.*'];

            beforeEach(async () => {
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });
                await channelContext.channel.assertQueue(baseQueueName);
            });

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.assertQueue(baseQueueName, BunnyBus.DEFAULT_QUEUE_CONFIGURATION),
                    channelContext.channel.assertExchange(instance.config.globalExchange, 'topic')
                ]);

                await channelContext.channel.purgeQueue(baseQueueName);

                await Promise.all(
                    patterns.map((pattern) => channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, pattern))
                );
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(baseQueueName),
                    channelContext.channel.deleteQueue(baseQueueName)
                ]);

                await instance.stop();
            });

            it('should publish for route `a`', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, null, true, null);
            });

            it('should publish for route `a` when disableExchangeCreate === true', async () => {
                instance.config = { disableExchangeCreate: true };

                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, null, true, null);
            });

            it('should publish for route `a` when miscellaneous amqplib options are included', async () => {
                const amqpOptions = {
                    expiration: '1000',
                    userId: 'guest',
                    CC: 'a',
                    priority: 1,
                    persistent: false,
                    deliveryMode: 1,
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

                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, null, true, amqpOptions, null);
            });

            it('should publish for route `a` when header options are included', async () => {
                const headerOptions = {
                    namespace: 'foo.bar::hello.world',
                    id: 'abc-1Z_32G',
                    eventType: 'type-G',
                    schemaVrsion: '1.3.4'
                };

                await Assertions.assertPublish(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    'a',
                    null,
                    null,
                    true,
                    null,
                    headerOptions
                );
            });

            it('should publish for route `a` when miscellaneous amqplib option and header options are included', async () => {
                const headerOptions = {
                    namespace: 'foo.bar::hello.world',
                    id: 'abc-1Z_32G',
                    eventType: 'type-G',
                    schemaVrsion: '1.3.4'
                };

                const amqpOptions = {
                    expiration: '1000',
                    userId: 'guest',
                    CC: 'a',
                    priority: 1,
                    persistent: false,
                    deliveryMode: 1,
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

                await Assertions.assertPublish(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    'a',
                    null,
                    null,
                    true,
                    amqpOptions,
                    headerOptions
                );
            });

            it('should publish for route `a.b`', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a.b', null, null, true, null, null);
            });

            it('should publish for route `b`', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'b', null, null, true, null, null);
            });

            it('should publish for route `b.b`', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'b.b', null, null, true, null, null);
            });

            it('should publish for route `z.a`', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'z.a', null, null, true, null, null);
            });

            it('should publish for route `z` but not route to queue', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'z', null, null, false, null, null);
            });

            it('should proxy `source` when supplied', async () => {
                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, 'someModule', true, null, null);
            });

            it('should proxy `transactionId` when supplied', async () => {
                await Assertions.assertPublish(
                    instance,
                    channelContext,
                    message,
                    baseQueueName,
                    'a',
                    'someTransactionId',
                    null,
                    true,
                    null,
                    null
                );
            });

            it('should publish for route `a` when route key is provided in the message', async () => {
                const messageWithRoute = Object.assign({}, message, { event: 'a' });

                await Assertions.assertPublish(
                    instance,
                    channelContext,
                    messageWithRoute,
                    baseQueueName,
                    null,
                    null,
                    null,
                    true,
                    null,
                    null
                );
            });

            it('should not error when connection does not pre-exist', async () => {
                await connectionManager.close(BunnyBus.DEFAULT_CONNECTION_NAME);

                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, null, true, null, null);
            });

            it('should not error when channel does not pre-exist', async () => {
                await channelManager.close(BunnyBus.QUEUE_CHANNEL_NAME(baseQueueName));

                await Assertions.assertPublish(instance, channelContext, message, baseQueueName, 'a', null, null, true, null, null);
            });
        });
    });
});
