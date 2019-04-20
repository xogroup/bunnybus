'use strict';

const { expect } = require('@hapi/code');

const {
    before,
    beforeEach,
    after,
    afterEach,
    describe,
    it
} = (exports.lab = require('@hapi/lab').script());
const Exceptions = require('../lib/exceptions');
const Assertions = require('./assertions');
const Pkg = require('../package.json');

const BunnyBus = require('../lib');

let instance;

const delay = (timeout) =>
    new Promise((resolve) => setTimeout(resolve, timeout));

describe('positive integration tests', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
        instance.config.validatePublisher = true;
        instance.config.validateVersion = true;
    });

    describe('connection', () => {
        before(async () => {
            await instance._closeConnection();
        });

        afterEach(async () => {
            await instance._closeConnection();
        });

        it('should create connection with default values', async () => {
            await instance._createConnection();
            expect(instance.connection).to.exist();
        });

        it('should close an opened connection', async () => {
            await instance._createConnection();
            await instance._closeConnection();
            expect(instance.connection).to.not.exist();
        });
    });

    describe('channel', () => {
        before(async () => {
            await instance._closeChannel();
        });

        beforeEach(async () => {
            await instance._closeChannel.bind(instance)(),
            await instance._createConnection.bind(instance)();
        });

        it('should create channel with default values', async () => {
            await instance._createChannel();
            expect(instance.channel).to.exist();
        });

        it('should close an opened channel', async () => {
            await instance._createChannel();
            await instance._closeChannel();
            expect(instance.channel).to.not.exist();
        });

        it('should close both connection and channel when closing a connection', async () => {
            await instance._createChannel();
            await instance._closeConnection();
            expect(instance.connection).to.not.exist();
            expect(instance.channel).to.not.exist();
        });
    });

    describe('_autoConnectChannel', () => {
        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should create connection and channel', async () => {
            await instance._autoConnectChannel();
            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });

        it('should create connection and channel properly with no race condition', async () => {
            await Promise.all(
                [1, 2, 3, 4].map(
                    async () => await instance._autoConnectChannel()
                )
            );
            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });
    });

    describe('_recoverConnectChannel', () => {
        beforeEach(async () => {
            await instance._autoConnectChannel();
        });

        afterEach(async () => {
            await instance._closeConnection();
        });

        it('should recreate connection when connection error occurs', async () => {
            instance.connection.emit('error');
            await delay(70);
            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });

        it('should recreate connection when channel error occurs', async () => {
            instance.channel.emit('error');
            await delay(70);
            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });
    });

    describe('queue', () => {
        const queueName = 'test-queue-1';

        beforeEach(async () => {
            await instance._autoConnectChannel();
        });

        it('should create queue with name `test-queue-1`', async () => {
            const result = await instance.createQueue(queueName);
            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(0);
        });

        it('should check queue with name `test-queue-1`', async () => {
            const result = await instance.checkQueue(queueName);
            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(0);
        });

        it('should delete queue with name `test-queue-1`', async () => {
            const result = await instance.deleteQueue(queueName);
            expect(result.messageCount).to.be.equal(0);
        });
    });

    describe('exchange', () => {
        const exchangeName = 'test-exchange-1';

        before(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange(exchangeName);
        });

        beforeEach(async () => {
            await instance._autoConnectChannel();
        });

        it('should create exchange with name `test-exchange-1`', async () => {
            await instance.createExchange(exchangeName, 'topic');
        });

        it('should check exchange with name `test-exchange-1`', async () => {
            await instance.checkExchange(exchangeName);
        });

        it('should delete exchange with name `test-exchange-1`', async () => {
            await instance.deleteExchange(exchangeName);
        });

        it('should recover from a non existent exchange', async () => {
            await new Promise(async (resolve) => {
                instance.once(BunnyBus.Events.RECOVERED, resolve);

                try {
                    await instance.checkExchange(exchangeName);
                }
                catch (error) {}
            });
        });
    });

    describe('send / get', () => {
        const queueName = 'test-send-queue-1';
        const message = { name: 'bunnybus' };
        const messageWithEvent = { event: 'event1', name: 'bunnybus' };

        beforeEach(async () => {
            await instance._closeConnection();
        });

        afterEach(async () => {
            await instance.deleteQueue(queueName);
        });

        it('should send message', async () => {
            await Assertions.assertSend({
                instance,
                message,
                queueName
            });
        });

        it('should send message when miscellaneous amqplib options are included', async () => {
            const sendOptions = {
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

            await Assertions.assertSend({
                instance,
                message,
                queueName,
                sendOptions
            });
        });

        it('should proxy `source` when supplied', async () => {
            await Assertions.assertSend({
                instance,
                message,
                queueName,
                source: 'someModule'
            });
        });

        it('should proxy `transactionId` when supplied', async () => {
            await Assertions.assertSend({
                instance,
                message,
                queueName,
                transactionId: 'someTransactionId'
            });
        });

        it('should proxy `routeKey` when supplied', async () => {
            await Assertions.assertSend({
                instance,
                message,
                queueName,
                routeKey: 'event1'
            });
        });

        it('should proxy `routeKey` when supplied', async () => {
            await Assertions.assertSend({
                instance,
                message: messageWithEvent,
                queueName
            });
        });
    });

    describe('getAll', () => {
        const queueName = 'test-get-all-queue-1';
        const message = { name: 'bunnybus' };

        beforeEach(async () => {
            await instance._closeConnection();
        });

        afterEach(async () => {
            await instance.deleteQueue(queueName);
        });

        it('should retrieve all message without meta flag', async () => {
            await Assertions.assertGetAll({
                instance,
                message,
                queueName,
                meta: false,
                limit: 10
            });
        });

        it('should retrieve all message with meta flag', async () => {
            await Assertions.assertGetAll({
                instance,
                message,
                queueName,
                meta: true,
                limit: 10
            });
        });
    });

    describe('publish', () => {
        const queueName = 'test-publish-queue-1';
        const message = { name: 'bunnybus' };
        const patterns = ['a', 'a.b', 'b', 'b.b', 'z.*'];

        before(async () => {
            await instance._autoConnectChannel();
            await instance.createExchange.bind(
                instance,
                instance.config.globalExchange,
                'topic'
            )();
            await instance.createQueue.bind(instance, queueName)();

            await Promise.all(
                patterns.map(
                    async (item) =>
                        await instance.channel.bindQueue(
                            queueName,
                            instance.config.globalExchange,
                            item,
                            null
                        )
                )
            );
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        it('should publish for route `a`', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'a',
                shouldRoute: true
            });
        });

        it('should publish for route `a`  when miscellaneous amqplib options are included', async () => {
            const publishOptions = {
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

            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'a',
                shouldRoute: true,
                publishOptions
            });
        });

        it('should publish for route `a.b`', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'a.b',
                shouldRoute: true
            });
        });

        it('should publish for route `b`', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'b',
                shouldRoute: true
            });
        });

        it('should publish for route `b.b`', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'b.b',
                shouldRoute: true
            });
        });

        it('should publish for route `z.a`', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'z.a',
                shouldRoute: true
            });
        });

        it('should publish for route `z` but not route to queue', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'z',
                shouldRoute: false
            });
        });

        it('should proxy `source` when supplied', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'a',
                source: 'someModule',
                shouldRoute: true
            });
        });

        it('should proxy `transactionId` when supplied', async () => {
            await Assertions.assertPublish({
                instance,
                message,
                queueName,
                routeKey: 'a',
                source: 'someTransactionId',
                shouldRoute: true
            });
        });

        it('should publish for route `a` when route key is provided in the message', async () => {
            const messageWithRoute = Object.assign({}, message, { event: 'a' });
            await Assertions.assertPublish({
                instance,
                message: messageWithRoute,
                queueName,
                shouldRoute: true
            });
        });
    });

    describe('subscribe / unsubscribe (single queue)', () => {
        const queueName = 'test-subscribe-queue-1';
        const errorQueueName = `${queueName}_error`;
        const publishOptions = { routeKey: 'a.b' };
        const subscribeOptionsWithMeta = { meta: true };
        const messageObject = { event: 'a.b', name: 'bunnybus' };
        const messageString = 'bunnybus';
        const messageBuffer = Buffer.from(messageString);

        before(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        afterEach(async () => {
            await instance.unsubscribe(queueName);
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [messageObject.event]: async (consumedMessage, ack) => {
                        expect(consumedMessage).to.be.equal(messageObject);
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(instance, messageObject)();
            });
        });

        it('should consume message (Object) and meta from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [messageObject.event]: async (
                        consumedMessage,
                        meta,
                        ack
                    ) => {
                        expect(consumedMessage).to.equal(messageObject);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(
                    instance,
                    queueName,
                    handlers,
                    subscribeOptionsWithMeta
                )(),
                await instance.publish.bind(instance, messageObject)();
            });
        });

        it('should consume message (String) from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (consumedMessage, ack) => {
                        expect(consumedMessage).to.be.equal(messageString);
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(
                    instance,
                    messageString,
                    publishOptions
                )();
            });
        });

        it('should consume message (String) and meta from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        meta,
                        ack
                    ) => {
                        expect(consumedMessage).to.equal(messageString);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(
                    instance,
                    queueName,
                    handlers,
                    subscribeOptionsWithMeta
                )();
                await instance.publish.bind(
                    instance,
                    messageString,
                    publishOptions
                )();
            });
        });

        it('should consume message (Buffer) from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (consumedMessage, ack) => {
                        expect(consumedMessage).to.be.equal(messageBuffer);
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(
                    instance,
                    messageBuffer,
                    publishOptions
                )();
            });
        });

        it('should consume message (Buffer) and meta from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        meta,
                        ack
                    ) => {
                        expect(consumedMessage).to.equal(messageBuffer);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(
                    instance,
                    queueName,
                    handlers,
                    subscribeOptionsWithMeta
                )();
                await instance.publish.bind(
                    instance,
                    messageBuffer,
                    publishOptions
                )();
            });
        });

        it('should consume message (Object) from queue and reject off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [messageObject.event]: async (
                        consumedMessage,
                        ack,
                        reject
                    ) => {
                        expect(consumedMessage).to.be.equal(messageObject);

                        await reject();
                        const payload = await instance.get(errorQueueName);
                        expect(payload).to.exist();
                        const errorMessage = JSON.parse(
                            payload.content.toString()
                        );
                        expect(errorMessage).to.be.equal(messageObject);
                        expect(
                            payload.properties.headers.isBuffer
                        ).to.be.false();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(instance, messageObject)();
            });
        });

        it('should consume message (Buffer) from queue and reject off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        ack,
                        reject
                    ) => {
                        expect(consumedMessage).to.be.equal(messageBuffer);

                        await reject();
                        const payload = await instance.get(errorQueueName);
                        expect(payload).to.exist();
                        const errorMessage = payload.content;
                        expect(errorMessage).to.be.equal(messageBuffer);
                        expect(
                            payload.properties.headers.isBuffer
                        ).to.be.true();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(
                    instance,
                    messageBuffer,
                    publishOptions
                )();
            });
        });

        it(
            'should consume message (Object) from queue and requeue off on maxRetryCount',
            { timeout: 0 },
            async () => {
                await new Promise(async (resolve) => {
                    const handlers = {
                        [messageObject.event]: async (
                            consumedMessage,
                            ack,
                            reject,
                            requeue
                        ) => {
                            ++retryCount;

                            if (retryCount < maxRetryCount) {
                                return await requeue();
                            }

                            expect(consumedMessage).to.be.equal(messageObject);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();
                            resolve();
                        }
                    };

                    const maxRetryCount = 3;
                    let retryCount = 0;

                    await instance.subscribe.bind(
                        instance,
                        queueName,
                        handlers,
                        {
                            maxRetryCount
                        }
                    )();
                    await instance.publish.bind(instance, messageObject)();
                });
            }
        );

        it(
            'should consume message (Buffer) from queue and requeue off on maxRetryCount',
            { timeout: 0 },
            async () => {
                await new Promise(async (resolve) => {
                    const handlers = {
                        [publishOptions.routeKey]: async (
                            consumedMessage,
                            ack,
                            reject,
                            requeue
                        ) => {
                            ++retryCount;

                            if (retryCount < maxRetryCount) {
                                return await requeue();
                            }

                            expect(consumedMessage).to.be.equal(messageBuffer);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();
                            resolve();
                        }
                    };

                    const maxRetryCount = 3;
                    let retryCount = 0;

                    await instance.subscribe.bind(
                        instance,
                        queueName,
                        handlers,
                        {
                            maxRetryCount
                        }
                    )();
                    await instance.publish.bind(
                        instance,
                        messageBuffer,
                        publishOptions
                    )();
                });
            }
        );

        it('should reject message without bunnyBus header property', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        //this should never be called.
                        await ack();
                    }
                };
                const config = instance.config;
                const headers = {
                    headers: {
                        transactionId: '1234abcd',
                        isBuffer: false,
                        routeKey: publishOptions.routeKey,
                        createAt: new Date().toISOString()
                    }
                };

                instance.once(BunnyBus.Events.LOG_WARN, (message) => {
                    expect(message).to.be.equal(
                        'message not of BunnyBus origin'
                    );
                    resolve();
                });
                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.channel.publish(
                    config.globalExchange,
                    publishOptions.routeKey,
                    Buffer.from(JSON.stringify(messageObject)),
                    headers
                );
            });
        });

        it('should reject message with mismatched version', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        //this should never be called.
                        await ack();
                    }
                };
                const config = instance.config;
                const version = '0.0.1';
                const headers = {
                    headers: {
                        transactionId: '1234abcd',
                        isBuffer: false,
                        routeKey: publishOptions.routeKey,
                        createAt: new Date().toISOString(),
                        bunnyBus: version
                    }
                };

                instance.once(BunnyBus.Events.LOG_WARN, (message) => {
                    expect(message).to.be.equal(
                        `message came from older bunnyBus version (${version})`
                    );
                    resolve();
                });
                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.channel.publish(
                    config.globalExchange,
                    publishOptions.routeKey,
                    Buffer.from(JSON.stringify(messageObject)),
                    headers
                );
            });
        });

        it('should accept message without bunnyBus header when overridden', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        await ack();
                        resolve();
                    }
                };
                const validatePublisher = false;
                const config = instance.config;
                const headers = {
                    headers: {
                        transactionId: '1234abcd',
                        isBuffer: false,
                        routeKey: publishOptions.routeKey,
                        createAt: new Date().toISOString()
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers, {
                    validatePublisher
                })();
                await instance.channel.publish(
                    config.globalExchange,
                    publishOptions.routeKey,
                    Buffer.from(JSON.stringify(messageObject)),
                    headers
                );
            });
        });

        it('should accept message with bunnyBus header with mismatched version when overriden', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [publishOptions.routeKey]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        await ack();
                        resolve();
                    }
                };
                const validateVersion = false;
                const config = instance.config;
                const version = '0.0.1';
                const headers = {
                    headers: {
                        transactionId: '1234abcd',
                        isBuffer: false,
                        routeKey: publishOptions.routeKey,
                        createAt: new Date().toISOString(),
                        bunnyBus: version
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers, {
                    validateVersion
                })();
                await instance.channel.publish(
                    config.globalExchange,
                    publishOptions.routeKey,
                    Buffer.from(JSON.stringify(messageObject)),
                    headers
                );
            });
        });
    });

    describe('subscribe / unsubscribe (single queue with * route)', () => {
        const queueName = 'test-subscribe-queue-with-star-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.*.xyz';
        const routableObject = {
            event: 'abc.helloworld.xyz',
            name: 'bunnybus'
        };

        before(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        afterEach(async () => {
            await instance.unsubscribe(queueName);
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [subscriptionKey]: async (consumedMessage, ack) => {
                        expect(consumedMessage).to.be.equal(routableObject);
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(instance, routableObject)();
            });
        });
    });

    describe('subscribe / unsubscribe (single queue with # route)', () => {
        const queueName = 'test-subscribe-queue-with-hash-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.#.xyz';
        const routableObject = {
            event: 'abc.hello.world.xyz',
            name: 'bunnybus'
        };

        before(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        afterEach(async () => {
            await instance.unsubscribe(queueName);
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                const handlers = {
                    [subscriptionKey]: async (consumedMessage, ack) => {
                        expect(consumedMessage).to.be.equal(routableObject);
                        await ack();
                        resolve();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(instance, routableObject)();
            });
        });
    });

    describe('subscribe / unsubscribe (multiple queue)', () => {
        const queueName1 = 'test-subscribe-multiple-queue-1';
        const queueName2 = 'test-subscribe-multiple-queue-2';
        const message = { event: 'a.b', name: 'bunnybus' };

        before(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName1)();
            await instance.deleteQueue.bind(instance, queueName2)();
        });

        afterEach(async () => {
            await instance.unsubscribe.bind(instance, queueName1)();
            await instance.unsubscribe.bind(instance, queueName2)();
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName1)();
            await instance.deleteQueue.bind(instance, queueName2)();
        });

        it('should consume message from two queues and acknowledge off', async () => {
            await new Promise(async (resolve) => {
                let counter = 0;
                const handlers = {
                    [message.event]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        expect(consumedMessage.name).to.be.equal(message.name);
                        await ack();
                        ++counter;
                        if (counter === 2) {
                            resolve();
                        }
                    }
                };

                await instance.subscribe.bind(instance, queueName1, handlers)();
                await instance.subscribe.bind(instance, queueName2, handlers)();
                await instance.publish.bind(instance, message)();
            });
        });
    });

    describe('_ack', () => {
        const queueName = 'test-acknowledge-queue-1';
        const message = { name: 'bunnybus', event: 'a' };
        const patterns = ['a'];

        before(async () => {
            await instance._autoConnectChannel();
            await instance.createExchange.bind(
                instance,
                instance.config.globalExchange,
                'topic'
            )();
            await instance.createQueue.bind(instance, queueName)();

            await Promise.all(
                patterns.map((pattern) =>
                    instance.channel.bindQueue(
                        queueName,
                        instance.config.globalExchange,
                        pattern,
                        null
                    )
                )
            );
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        it('should ack a message off the queue', async () => {
            await instance.publish.bind(instance, message)();
            const payload = await instance.get.bind(instance, queueName)();
            await instance._ack(payload);
            const result = await instance.checkQueue.bind(
                instance,
                queueName
            )();
            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(0);
        });
    });

    describe('_requeue', () => {
        const queueName = 'test-requeue-queue-1';
        const message = { name: 'bunnybus', event: 'a' };
        const patterns = ['a'];

        beforeEach(async () => {
            await instance.channel.purgeQueue(queueName);
        });

        before(async () => {
            await instance._autoConnectChannel();
            await instance.createExchange.bind(
                instance,
                instance.config.globalExchange,
                'topic'
            )();
            await instance.createQueue.bind(instance, queueName)();

            await Promise.all(
                patterns.map(
                    async (item) =>
                        await instance.channel.bindQueue(
                            queueName,
                            instance.config.globalExchange,
                            item,
                            null
                        )
                )
            );
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
        });

        it('should requeue a message off the queue', async () => {
            await instance.publish.bind(instance, message)();
            const payload = await instance.get.bind(instance, queueName)();
            await instance._requeue(payload, queueName);
            const result = await instance.checkQueue.bind(
                instance,
                queueName
            )();

            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(1);
        });

        it('should requeue with well formed header properties', async () => {
            const publishOptions = {
                source: 'test'
            };

            let transactionId = null;
            let createdAt = null;

            await instance.publish.bind(instance, message, publishOptions)();
            const payload1 = await instance.get.bind(instance, queueName)();
            transactionId = payload1.properties.headers.transactionId;
            createdAt = payload1.properties.headers.createdAt;
            await instance._requeue(payload1, queueName);

            const payload2 = await instance.get.bind(instance, queueName)();
            expect(payload2.properties.headers.transactionId).to.be.equal(
                transactionId
            );
            expect(payload2.properties.headers.createdAt).to.be.equal(
                createdAt
            );
            expect(payload2.properties.headers.source).to.be.equal(
                publishOptions.source
            );
            expect(payload2.properties.headers.requeuedAt).to.exist();
            expect(payload2.properties.headers.retryCount).to.be.equal(1);
            expect(payload2.properties.headers.routeKey).to.be.equal(
                message.event
            );
            expect(payload2.properties.headers.bunnyBus).to.be.equal(
                Pkg.version
            );
        });
    });

    describe('_reject', () => {
        const errorQueueName = 'test-reject-error-queue-1';
        const queueName = 'test-reject-queue-1';
        const message = { name: 'bunnybus', event: 'a' };
        const patterns = ['a'];

        beforeEach(async () => {
            await instance.channel.purgeQueue(queueName);
        });

        before(async () => {
            await instance._autoConnectChannel();
            await instance.createExchange.bind(
                instance,
                instance.config.globalExchange,
                'topic'
            )();
            await instance.createQueue.bind(instance, queueName)();

            await Promise.all(
                patterns.map(
                    async (pattern) =>
                        await instance.channel.bindQueue(
                            queueName,
                            instance.config.globalExchange,
                            pattern,
                            null
                        )
                )
            );
        });

        after(async () => {
            await instance._autoConnectChannel();
            await instance.deleteExchange.bind(
                instance,
                instance.config.globalExchange
            )();
            await instance.deleteQueue.bind(instance, queueName)();
            await instance.deleteQueue.bind(instance, errorQueueName)();
        });

        afterEach(async () => {
            await instance.deleteQueue(errorQueueName);
        });

        it('should reject a message off the queue', async () => {
            await instance.publish.bind(instance, message)();
            const payload = await instance.get.bind(instance, queueName)();
            await instance._reject(payload, errorQueueName);

            const result = await instance.checkQueue.bind(
                instance,
                errorQueueName
            )();
            expect(result.queue).to.be.equal(errorQueueName);
            expect(result.messageCount).to.be.equal(1);
        });

        it('should reject with well formed header properties', async () => {
            const publishOptions = {
                source: 'test'
            };
            const requeuedAt = new Date().toISOString();
            const retryCount = 5;
            let transactionId = null;
            let createdAt = null;

            await instance.publish.bind(instance, message, publishOptions)();
            const payload1 = await instance.get.bind(instance, queueName)();
            transactionId = payload1.properties.headers.transactionId;
            createdAt = payload1.properties.headers.createdAt;
            payload1.properties.headers.requeuedAt = requeuedAt;
            payload1.properties.headers.retryCount = retryCount;
            await instance._reject(payload1, errorQueueName);

            const payload2 = await instance.get.bind(
                instance,
                errorQueueName
            )();
            expect(payload2.properties.headers.transactionId).to.be.equal(
                transactionId
            );
            expect(payload2.properties.headers.createdAt).to.be.equal(
                createdAt
            );
            expect(payload2.properties.headers.source).to.be.equal(
                publishOptions.source
            );
            expect(payload2.properties.headers.requeuedAt).to.be.equal(
                requeuedAt
            );
            expect(payload2.properties.headers.retryCount).to.be.equal(
                retryCount
            );
            expect(payload2.properties.headers.erroredAt).to.exist();
            expect(payload2.properties.headers.bunnyBus).to.be.equal(
                Pkg.version
            );
        });

        it('should reject when exceeding max requeues', async () => {
            let retryCount = 0;
            const { maxRetryCount } = instance.config;
            await new Promise(async (resolve) => {
                const handlers = {
                    [message.event]: async (
                        consumedMessage,
                        ack,
                        reject,
                        requeue
                    ) => {
                        expect(consumedMessage).to.be.equal(message);
                        ++retryCount;
                        if (retryCount >= maxRetryCount) {
                            resolve();
                        }

                        await requeue();
                    }
                };

                await instance.subscribe.bind(instance, queueName, handlers)();
                await instance.publish.bind(instance, message)();
            });
        });
    });
});

describe('negative integration tests', () => {
    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
    });

    describe('channel', () => {
        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoConnectionError when connection does not pre-exist', async () => {
            await expect(instance._createChannel()).to.reject(
                Exceptions.NoConnectionError
            );
        });
    });

    describe('queue', () => {
        const queueName = 'test-queue-1';

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling createQueue and connection does not pre-exist', async () => {
            await expect(instance.createQueue(queueName)).to.reject(
                Exceptions.NoChannelError
            );
        });

        it('should throw NoChannelError when calling checkQueue and connection does not pre-exist', async () => {
            await expect(instance.checkQueue(queueName)).to.reject(
                Exceptions.NoChannelError
            );
        });

        it('should throw NoChannelError when calling deleteQueue and connection does not pre-exist', async () => {
            await expect(instance.deleteQueue(queueName)).to.reject(
                Exceptions.NoChannelError
            );
        });
    });

    describe('exchange', () => {
        const exchangeName = 'test-exchange-1';

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling createExchange and connection does not pre-exist', async () => {
            await expect(instance.createExchange(exchangeName)).to.reject(
                Exceptions.NoChannelError
            );
        });

        it('should throw NoChannelError when calling checkExchange and connection does not pre-exist', async () => {
            await expect(instance.checkExchange(exchangeName)).to.reject(
                Exceptions.NoChannelError
            );
        });

        it('should throw NoChannelError when calling deleteExchange and connection does not pre-exist', async () => {
            await expect(instance.deleteExchange(exchangeName)).to.reject(
                Exceptions.NoChannelError
            );
        });
    });

    describe('get', () => {
        const queueName = 'test-queue-1';

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling get and connection does not pre-exist', async () => {
            await expect(instance.get(queueName)).to.reject(
                Exceptions.NoChannelError
            );
        });
    });

    describe('publish', () => {
        const message = { name: 'bunnybus' };

        it('should throw NoRouteKeyError when calling publish and `options.routeKey` nor `message.event` exist', async () => {
            await expect(instance.publish(message)).to.reject(
                Exceptions.NoRouteKeyError
            );
        });
    });

    describe('subscribe', () => {
        const queueName = 'test-queue-1';
        const consumerTag = 'abcde12345';
        const handlers = { event1: () => {} };

        afterEach(() => {
            instance.subscriptions._subscriptions.clear();
            instance.subscriptions._blockQueues.clear();
        });

        it('should throw SubscriptionExistError when calling subscribe on an active subscription exist', async () => {
            instance.subscriptions.create(queueName, handlers);
            instance.subscriptions.tag(queueName, consumerTag);

            await expect(instance.subscribe(queueName, handlers)).to.reject(
                Exceptions.SubscriptionExistError
            );
        });

        it('should throw SubscriptionBlockedError when calling subscribe against a blocked queue', async () => {
            instance.subscriptions.block(queueName);

            await expect(instance.subscribe(queueName, handlers)).to.reject(
                Exceptions.SubscriptionBlockedError
            );
        });
    });

    describe('acknowledge', () => {
        const payload = {
            content: Buffer.from('hello')
        };

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling _ack and connection does not pre-exist', async () => {
            await expect(instance._ack(payload)).to.reject(
                Exceptions.NoChannelError
            );
        });
    });

    describe('requeue', () => {
        const payload = {
            content: Buffer.from('hello')
        };

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling _requeue and connection does not pre-exist', async () => {
            await expect(instance._requeue(payload, '')).to.reject(
                Exceptions.NoChannelError
            );
        });
    });

    describe('reject', () => {
        const payload = {
            content: Buffer.from('hello')
        };

        beforeEach(async () => {
            await instance._closeConnection();
        });

        it('should throw NoChannelError when calling _reject and connection does not pre-exist', async () => {
            await expect(instance._reject(payload, '')).to.reject(
                Exceptions.NoChannelError
            );
        });
    });
});
