'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');

const { describe, before, beforeEach, after, afterEach, it } = exports.lab = Lab.script();
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
            const publishOptions = { routeKey: 'a.b' };
            const subscribeOptionsWithMeta = { meta: true };
            const messageObject = { event: 'a.b', name: 'bunnybus' };
            const messageString = 'bunnybus';
            const messageBuffer = Buffer.from(messageString);

            before(async () => {

                channelContext = await instance._autoBuildChannelContext(baseChannelName);

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            afterEach(async () => {

                await instance.unsubscribe(baseQueueName);
            });

            after(async () => {

                await Promise.all([
                    channelContext.channel.deleteExchange(instance.config.globalExchange),
                    channelContext.channel.deleteQueue(baseQueueName),
                    channelContext.channel.deleteQueue(baseErrorQueueName)
                ]);
            });

            it('should consume message (Object) from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[messageObject.event] = async (consumedMessage, ack) => {

                        expect(consumedMessage).to.be.equal(messageObject);

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers),
                    await instance.publish(messageObject);
                });
            });

            it('should consume message (Object) and meta from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[messageObject.event] = async (consumedMessage, meta, ack) => {

                        expect(consumedMessage).to.equal(messageObject);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, subscribeOptionsWithMeta);
                    await instance.publish(messageObject);
                });
            });

            it('should consume message (String) from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        expect(consumedMessage).to.be.equal(messageString);

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers),
                    await instance.publish(messageString, publishOptions);
                });
            });

            it('should consume message (String) and meta from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[publishOptions.routeKey] = async (consumedMessage, meta, ack) => {

                        expect(consumedMessage).to.equal(messageString);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, subscribeOptionsWithMeta);
                    await instance.publish(messageString, publishOptions);
                });
            });

            it('should consume message (Buffer) from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        expect(consumedMessage).to.be.equal(messageBuffer);

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers);
                    await instance.publish(messageBuffer, publishOptions);
                });
            });

            it('should consume message (Buffer) and meta from queue and acknowledge off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[publishOptions.routeKey] = async (consumedMessage, meta, ack) => {

                        expect(consumedMessage).to.equal(messageBuffer);
                        expect(meta).to.not.be.a.function();
                        expect(meta.headers).to.exist();

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, subscribeOptionsWithMeta);
                    await instance.publish(messageBuffer, publishOptions);
                });
            });

            it('should consume message (Object) from queue and reject off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[messageObject.event] = async (consumedMessage, ack, reject) => {

                        expect(consumedMessage).to.be.equal(messageObject);

                        await reject();
                        const payload = await instance.get(baseErrorQueueName);

                        expect(payload).to.exist();
                        const errorMessage = JSON.parse(payload.content.toString());
                        expect(errorMessage).to.be.equal(messageObject);
                        expect(payload.properties.headers.isBuffer).to.be.false();

                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers);
                    await instance.publish(messageObject);
                });
            });

            it('should consume message (Buffer) from queue and reject off', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    handlers[publishOptions.routeKey] = async (consumedMessage, ack, reject) => {

                        expect(consumedMessage).to.be.equal(messageBuffer);

                        await reject();
                        const payload = await instance.get(baseErrorQueueName);

                        expect(payload).to.exist();
                        const errorMessage = payload.content;
                        expect(errorMessage).to.be.equal(messageBuffer);
                        expect(payload.properties.headers.isBuffer).to.be.true();

                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers);
                    await instance.publish(messageBuffer, publishOptions);
                });
            });

            it('should consume message (Object) from queue and requeue off on maxRetryCount', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    const maxRetryCount = 3;
                    let retryCount = 0;
                    handlers[messageObject.event] = async (consumedMessage, ack, reject, requeue) => {

                        ++retryCount;

                        if (retryCount < maxRetryCount) {
                            await requeue();
                        }
                        else {
                            expect(consumedMessage).to.be.equal(messageObject);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();

                            resolve();
                        }
                    };

                    await instance.subscribe(baseQueueName, handlers, { maxRetryCount });
                    await instance.publish(messageObject);
                });
            });

            it('should auto reject message from queue when requeue surpasses maxRetryCount limits', async () => {

                const handlers = {};
                const maxRetryCount = 1;
                const transactionId = 'retry-abc-134';

                handlers[messageObject.event] = async (consumedMessage, ack, reject, requeue) => await requeue();

                const promise =  new Promise((resolve) => {

                    instance.once(BunnyBus.MESSAGE_REJECTED_EVENT, (sentOptions, sentPayload) => {

                        expect(sentOptions.headers.retryCount).to.equal(maxRetryCount);
                        expect(sentOptions.headers.transactionId).to.equal(transactionId);

                        resolve();
                    });
                });

                await instance.subscribe(baseQueueName, handlers, { maxRetryCount });
                await instance.publish(messageObject, { transactionId });
                await promise;
            });

            it('should consume message (Buffer) from queue and requeue off on maxRetryCount', async () => {

                return new Promise(async (resolve) => {

                    const handlers = {};
                    const maxRetryCount = 3;
                    let retryCount = 0;
                    handlers[publishOptions.routeKey] = async (consumedMessage, ack, reject, requeue) => {

                        ++retryCount;

                        if (retryCount < maxRetryCount) {
                            await requeue();
                        }
                        else {
                            expect(consumedMessage).to.be.equal(messageBuffer);
                            expect(retryCount).to.be.equal(maxRetryCount);
                            await ack();
                            resolve();
                        }
                    };

                    await instance.subscribe(baseQueueName, handlers, { maxRetryCount });
                    await instance.publish(messageBuffer, publishOptions);
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
                            createAt: (new Date()).toISOString()
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        //this should never be called.
                        await ack();
                        reject(new Error('not expected to be called'));
                    };

                    instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {

                        expect(message).to.be.equal('message not of BunnyBus origin');

                        resolve();
                    });

                    await instance.subscribe(baseQueueName, handlers, { validatePublisher: true });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
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
                            createAt: (new Date()).toISOString()
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, { validatePublisher: false });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
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
                            createAt: (new Date()).toISOString(),
                            bunnyBus: version
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, { validatePublisher: true, validateVersion: false });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
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
                            createAt: (new Date()).toISOString(),
                            bunnyBus: version
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                        //this should never be called.
                        await ack();
                        reject(new Error('not expected to be called'));
                    };

                    instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {

                        expect(message).to.be.equal(`message came from older bunnyBus version (${version})`);

                        resolve();
                    });

                    await instance.subscribe(baseQueueName, handlers, { validatePublisher: true, validateVersion: true });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
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
                            createAt: (new Date()).toISOString()
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack, reject, requeue) => {

                        //this should never be called.
                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, { validatePublisher });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
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
                            createAt: (new Date()).toISOString(),
                            bunnyBus: version
                        }
                    };

                    handlers[publishOptions.routeKey] = async (consumedMessage, ack, reject, requeue) => {

                        //this should never be called.
                        await ack();
                        resolve();
                    };

                    await instance.subscribe(baseQueueName, handlers, { validateVersion });
                    channelContext.channel.publish(config.globalExchange, publishOptions.routeKey, Buffer.from(JSON.stringify(messageObject)), headers);
                });
            });

            it('should not create exchange to queue binding when disableQueueBind == true', async () => {

                const handlers = {};

                handlers[messageObject.event] = async (consumedMessage, ack) => {

                    await ack();
                };

                await instance.subscribe(baseQueueName, handlers, { disableQueueBind: true });
                await instance.publish(messageObject);
                const result = await instance.get(baseQueueName);

                expect(result).to.be.false();
            });

            it('should auto reject message off queue when there is a topic/route mismatch when rejectUnroutedMessages === true', async () => {

                const unregisteredTopic = 'd.f';
                const testObject = { event: unregisteredTopic, name: 'bunnybus' };
                const rejectionReason = `message consumed with no matching routeKey (${unregisteredTopic}) handler`;

                const handlers = {};
                handlers[messageObject.event] = async (consumedMessage, ack) => await ack();

                const promise = new Promise(async (resolve) => {

                    const eventHandler = (sentOptions, sentMessage) => {

                        if (sentOptions.headers.routeKey === unregisteredTopic) {
                            expect(sentOptions.headers.transactionId).to.exist();
                            expect(sentOptions.headers.isBuffer).to.be.false();
                            expect(sentOptions.headers.routeKey).to.equal(unregisteredTopic);
                            expect(sentOptions.headers.createdAt).to.exist();
                            expect(sentOptions.headers.erroredAt).to.exist();
                            expect(sentOptions.headers.bunnyBus).to.equal(require('../../../package.json').version);
                            expect(sentOptions.headers.reason).to.equal(rejectionReason);
                            expect(sentMessage).to.contains(testObject);

                            instance.removeListener(BunnyBus.MESSAGE_REJECTED_EVENT, eventHandler);
                            resolve();
                        }
                    };

                    instance.on(BunnyBus.MESSAGE_REJECTED_EVENT, eventHandler);
                });

                await instance.subscribe(baseQueueName, handlers, { rejectUnroutedMessages: true }),
                await channelContext.channel.bindQueue(baseQueueName, instance.config.globalExchange, unregisteredTopic);
                await instance.publish(testObject);
                await promise;
            });
        });
    });
});
