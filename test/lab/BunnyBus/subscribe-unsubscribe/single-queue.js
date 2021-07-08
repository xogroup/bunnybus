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
        describe('subscribe / unsubscribe (single queue)', () => {
            const baseChannelName = 'bunnybus-subscribe';
            const baseQueueName = 'test-subscribe-queue';
            const baseErrorQueueName = `${baseQueueName}_error`;
            const customErrorQueueName = `${baseQueueName}_custom_error`;
            const publishOptions = { routeKey: 'a.b' };
            const messageObject = { event: 'a.b', name: 'bunnybus' };
            const messageString = 'bunnybus';
            const messageBuffer = Buffer.from(messageString);

            before(async () => {
                channelContext = await instance._autoBuildChannelContext({ channelName: baseChannelName });

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName),
                    channelContext.channel.deleteQueue(customErrorQueueName)
                ]);
            });

            afterEach(async () => {
                await instance.unsubscribe({ queue: baseQueueName });
            });

            after(async () => {
                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName),
                    channelContext.channel.deleteQueue(customErrorQueueName)
                ]);

                await instance.stop();
            });

            it('should consume message (Object) from queue and acknowledge off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[messageObject.event] = async ({ message: consumedMessage, metaData, ack }) => {
                        expect(consumedMessage).to.be.equal(messageObject);
                        expect(metaData.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageObject });
                });
            });

            it('should consume message (String) from queue and acknowledge off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[publishOptions.routeKey] = async ({ message: consumedMessage, metaData, ack }) => {
                        expect(consumedMessage).to.be.equal(messageString);
                        expect(metaData.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageString, options: publishOptions });
                });
            });

            it('should consume message (Buffer) from queue and acknowledge off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[publishOptions.routeKey] = async ({ message: consumedMessage, metaData, ack }) => {
                        expect(consumedMessage).to.be.equal(messageBuffer);
                        expect(metaData.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageBuffer, options: publishOptions });
                });
            });

            it('should consume message (Object) from queue and reject off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[messageObject.event] = async ({ message: consumedMessage, ack, rej }) => {
                        expect(consumedMessage).to.be.equal(messageObject);

                        await rej();
                        const payload = await instance.get({ queue: baseErrorQueueName });

                        expect(payload).to.exist();
                        const errorMessage = JSON.parse(payload.content.toString());
                        expect(errorMessage).to.be.equal(messageObject);
                        expect(payload.properties.headers.isBuffer).to.be.false();

                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageObject });
                });
            });

            it('should consume message (Buffer) from queue and reject off', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[publishOptions.routeKey] = async ({ message: consumedMessage, rej }) => {
                        expect(consumedMessage).to.be.equal(messageBuffer);

                        await rej();
                        const payload = await instance.get({ queue: baseErrorQueueName });

                        expect(payload).to.exist();
                        const errorMessage = payload.content;
                        expect(errorMessage).to.be.equal(messageBuffer);
                        expect(payload.properties.headers.isBuffer).to.be.true();

                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageBuffer, options: publishOptions });
                });
            });

            it('should consume message (Object) from queue and reject off to a custom specified error queue', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[messageObject.event] = async ({ message: consumedMessage, rej }) => {
                        expect(consumedMessage).to.be.equal(messageObject);

                        await rej({ errorQueue: customErrorQueueName });
                        const payload = await instance.get({ queue: customErrorQueueName });

                        expect(payload).to.exist();

                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageObject });
                });
            });

            it('should consume message (Object) from queue and requeue off on maxRetryCount', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    const maxRetryCount = 3;
                    let retryCount = 0;
                    handlers[messageObject.event] = async ({ message: consumedMessage, ack, requeue }) => {
                        ++retryCount;

                        if (retryCount < maxRetryCount) {
                            await requeue();
                        } else {
                            expect(consumedMessage).to.be.equal(messageObject);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();

                            resolve();
                        }
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers, options: { maxRetryCount } });
                    await instance.publish({ message: messageObject });
                });
            });

            it('should auto reject message from queue when requeue surpasses maxRetryCount limits', async () => {
                const handlers = {};
                const maxRetryCount = 1;
                const transactionId = 'retry-abc-134';

                handlers[messageObject.event] = async ({ requeue }) => await requeue();

                const promise = new Promise((resolve) => {
                    instance.once(BunnyBus.MESSAGE_REJECTED_EVENT, (sentOptions, sentPayload) => {
                        expect(sentOptions.headers.retryCount).to.equal(maxRetryCount);
                        expect(sentOptions.headers.transactionId).to.equal(transactionId);

                        resolve();
                    });
                });

                await instance.subscribe({ queue: baseQueueName, handlers, options: { maxRetryCount } });
                await instance.publish({ message: messageObject, options: { transactionId } });
                await promise;
            });

            it('should consume message (Buffer) from queue and requeue off on maxRetryCount', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    const maxRetryCount = 3;
                    let retryCount = 0;
                    handlers[publishOptions.routeKey] = async ({ message: consumedMessage, ack, requeue }) => {
                        ++retryCount;

                        if (retryCount < maxRetryCount) {
                            await requeue();
                        } else {
                            expect(consumedMessage).to.be.equal(messageBuffer);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();
                            resolve();
                        }
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers, options: { maxRetryCount } });
                    await instance.publish({ message: messageBuffer, options: publishOptions });
                });
            });

            it('should reject message without bunnyBus header property when validatePublisher == true', async () => {
                return new Promise(async (resolve, reject) => {
                    const handlers = {};
                    const config = instance.config;
                    const headers = {
                        headers: {
                            transactionId: '1234abcd',
                            isBuffer: false,
                            routeKey: publishOptions.routeKey,
                            createAt: new Date().toISOString()
                        }
                    };

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        //this should never be called.
                        await ack();
                        reject(new Error('not expected to be called'));
                    };

                    instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {
                        expect(message).to.be.equal('message not of BunnyBus origin');

                        resolve();
                    });

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validatePublisher: true
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should consume message without bunnyBus header property when validatePublisher == false', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
                    const config = instance.config;
                    const headers = {
                        headers: {
                            transactionId: '1234abcd',
                            isBuffer: false,
                            routeKey: publishOptions.routeKey,
                            createAt: new Date().toISOString()
                        }
                    };

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        await ack();
                        resolve();
                    };

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validatePublisher: false
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should consume message with mismatched version when validatePublisher == true and validateVersion == false', async () => {
                return new Promise(async (resolve, reject) => {
                    const handlers = {};
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

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        await ack();
                        resolve();
                    };

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validatePublisher: true,
                            validateVersion: false
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should reject message with mismatched version when validatePublisher == true and validateVersion == true', async () => {
                return new Promise(async (resolve, reject) => {
                    const handlers = {};
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

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        //this should never be called.
                        await ack();
                        reject(new Error('not expected to be called'));
                    };

                    instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {
                        expect(message).to.be.equal(`message came from older bunnyBus version (${version})`);

                        resolve();
                    });

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validatePublisher: true,
                            validateVersion: true
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should accept message without bunnyBus header when overridden', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
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

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        //this should never be called.
                        await ack();
                        resolve();
                    };

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validatePublisher
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should accept message with bunnyBus header with mismatched version when overriden', async () => {
                return new Promise(async (resolve) => {
                    const handlers = {};
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

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        //this should never be called.
                        await ack();
                        resolve();
                    };

                    await instance.subscribe({
                        queue: baseQueueName,
                        handlers,
                        options: {
                            validateVersion
                        }
                    });
                    await channelContext.channel.publish(
                        config.globalExchange,
                        publishOptions.routeKey,
                        Buffer.from(JSON.stringify(messageObject)),
                        headers
                    );
                });
            });

            it('should not create exchange to queue binding when disableQueueBind == true', async () => {
                const handlers = {};

                handlers[messageObject.event] = async ({ ack }) => {
                    await ack();
                };

                await instance.subscribe({
                    queue: baseQueueName,
                    handlers,
                    options: {
                        disableQueueBind: true
                    }
                });
                await instance.publish({ message: messageObject });
                const result = await instance.get({ queue: baseQueueName });

                expect(result).to.be.false();
            });

            it('should auto reject message off queue when there is a topic/route mismatch when rejectUnroutedMessages === true', async () => {
                const unregisteredTopic = 'd.f';
                const testObject = { event: unregisteredTopic, name: 'bunnybus' };
                const rejectionReason = `message consumed with no matching routeKey (${unregisteredTopic}) handler`;

                const handlers = {};
                handlers[messageObject.event] = async ({ ack }) => await ack();

                const promise = new Promise(async (resolve) => {
                    const eventHandler = (sentOptions, sentMessage) => {
                        if (sentOptions.headers.routeKey === unregisteredTopic) {
                            expect(sentOptions.headers.transactionId).to.exist();
                            expect(sentOptions.headers.isBuffer).to.be.false();
                            expect(sentOptions.headers.routeKey).to.equal(unregisteredTopic);
                            expect(sentOptions.headers.createdAt).to.exist();
                            expect(sentOptions.headers.erroredAt).to.exist();
                            expect(sentOptions.headers.bunnyBus).to.equal(require('../../../../package.json').version);
                            expect(sentOptions.headers.reason).to.equal(rejectionReason);
                            expect(sentMessage).to.contains(testObject);

                            instance.removeListener(BunnyBus.MESSAGE_REJECTED_EVENT, eventHandler);
                            resolve();
                        }
                    };

                    instance.on(BunnyBus.MESSAGE_REJECTED_EVENT, eventHandler);
                });

                await instance.subscribe({
                    queue: baseQueueName,
                    handlers,
                    options: {
                        rejectUnroutedMessages: true
                    }
                }),
                    await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, unregisteredTopic);
                await instance.publish({ message: testObject });
                await promise;
            });

            it('should only acknowledge message from one of the matching handlers', async () => {
                let resolveCounter = 0;

                await new Promise(async (resolve) => {
                    const handlers = {};

                    const resolver = () => {
                        if (++resolveCounter === 1) {
                            resolve();
                        }
                    };

                    handlers[publishOptions.routeKey] = async ({ ack }) => {
                        ack();
                        resolver();
                    };

                    handlers['a.#'] = async ({ ack }) => {
                        ack();
                        resolver();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageString, options: publishOptions });
                });

                await new Promise((resolve) => setTimeout(resolve, 500));

                expect(resolveCounter).to.equal(1);
            });

            it('should consume and nack message', async () => {
                await new Promise(async (resolve) => {
                    const handlers = {};
                    handlers[messageObject.event] = async ({ message: consumedMessage, metaData, nack }) => {
                        expect(consumedMessage).to.be.equal(messageObject);
                        expect(metaData.headers).to.exist();

                        await nack();
                        resolve();
                    };

                    await instance.subscribe({ queue: baseQueueName, handlers });
                    await instance.publish({ message: messageObject });
                });

                // unsubscribe to not consume msg again
                await instance.unsubscribe({ queue: baseQueueName });
                // add delay to allow rabbit to catch up
                await new Promise((res) => setTimeout(res, 100));
                const result = await channelContext.channel.checkQueue(baseQueueName);
                expect(result.messageCount).to.be.equal(1);
            });
        });
    });
});
