'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');
const Exceptions = require('../../lib/exceptions');
const Assertions = require('./assertions');

const lab = exports.lab = Lab.script();
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../../lib');
let instance = undefined;

describe('positive integration tests - Callback api', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        instance.config.validatePublisher = true;
        instance.config.validateVersion = true;
        done();
    });

    describe('connection', () => {

        before((done) => {

            instance._closeConnection(done);
        });

        afterEach((done) => {

            instance._closeConnection(done);
        });

        it('should create connection with default values', (done) => {

            instance._createConnection((err) => {

                expect(err).to.not.exist();
                expect(instance.connection).to.exist();
                done();
            });
        });

        it('should close an opened connection', (done) => {

            Async.waterfall([
                instance._createConnection,
                instance._closeConnection
            ], (err) => {

                expect(err).to.not.exist();
                expect(instance.connection).to.not.exist();
                done(err);
            });
        });
    });

    describe('channel', () => {

        before((done) => {

            instance._closeChannel(done);
        });

        beforeEach((done) => {

            Async.waterfall([
                instance._closeChannel.bind(instance),
                instance._createConnection.bind(instance)
            ], done);
        });

        it('should create channel with default values', (done) => {

            instance._createChannel((err) => {

                expect(err).to.not.exist();
                expect(instance.channel).to.exist();
                done();
            });
        });

        it('should close an opened channel', (done) => {

            Async.waterfall([
                instance._createChannel,
                instance._closeChannel
            ], (err) => {

                expect(err).to.not.exist();
                expect(instance.channel).to.not.exist();
                done(err);
            });
        });

        it('should close both connection and channel when closing a connection', (done) => {

            Async.waterfall([
                instance._createChannel,
                instance._closeConnection
            ], (err) => {

                expect(err).to.not.exist();
                expect(instance.connection).to.not.exist();
                expect(instance.channel).to.not.exist();
                done(err);
            });
        });
    });

    describe('_autoConnectChannel', () => {

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should create connection and channel', (done) => {

            instance._autoConnectChannel((err) => {

                expect(err).to.not.exist();
                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            });
        });

        it('should create connection and channel properly with no race condition', (done) => {

            Async.parallel([
                instance._autoConnectChannel,
                instance._autoConnectChannel,
                instance._autoConnectChannel,
                instance._autoConnectChannel
            ],(err) => {

                expect(err).to.not.exist();
                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            });
        });
    });

    describe('_recoverConnectChannel', () => {

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        afterEach((done) => {

            instance._closeConnection(done);
        });

        it('should recreate connection when connection error occurs', (done) => {

            instance.connection.emit('error');

            setTimeout(() => {

                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            }, 70);
        });

        it('should recreate connection when channel error occurs', (done) => {

            instance.channel.emit('error');

            setTimeout(() => {

                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            }, 70);
        });
    });

    describe('queue', () => {

        const queueName = 'test-queue-1';

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        it('should create queue with name `test-queue-1`', (done) => {

            instance.createQueue(queueName, (err, result) => {

                expect(err).to.not.exist();
                expect(result.queue).to.be.equal(queueName);
                expect(result.messageCount).to.be.equal(0);
                done();
            });
        });

        it('should check queue with name `test-queue-1`', (done) => {

            instance.checkQueue(queueName, (err, result) => {

                expect(err).to.not.exist();
                expect(result.queue).to.be.equal(queueName);
                expect(result.messageCount).to.be.equal(0);
                done();
            });
        });

        it('should delete queue with name `test-queue-1`', (done) => {

            instance.deleteQueue(queueName, (err, result) => {

                expect(err).to.not.exist();
                expect(result.messageCount).to.be.equal(0);
                done();
            });
        });
    });

    describe('exchange', () => {

        const exchangeName = 'test-exchange-1';

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                (cb) => {

                    instance.deleteExchange(exchangeName, cb);
                }
            ], done);
        });

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        it('should create exchange with name `test-exchange-1`', (done) => {

            instance.createExchange(exchangeName, 'topic', (err, result) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('should check exchange with name `test-exchange-1`', (done) => {

            instance.checkExchange(exchangeName, (err, result) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('should delete exchange with name `test-exchange-1`', (done) => {

            instance.deleteExchange(exchangeName, (err, result) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('should recover from a non existent exchange', (done) => {

            instance.once(BunnyBus.RECOVERED_EVENT, done);

            instance.checkExchange(exchangeName, () => {});
        });
    });

    describe('send / get', () => {

        const queueName = 'test-send-queue-1';
        const message = { name : 'bunnybus' };
        const messageWithEvent = { event : 'event1', name : 'bunnybus' };

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        afterEach((done) => {

            instance.deleteQueue(queueName, done);
        });

        it('should send message', (done) => {

            Assertions.assertSend(instance, message, queueName, null, null, null, done);
        });

        it('should proxy `source` when supplied', (done) => {

            Assertions.assertSend(instance, message, queueName, null, 'someModule', null, done);
        });

        it('should proxy `transactionId` when supplied', (done) => {

            Assertions.assertSend(instance, message, queueName, 'someTransactionId', null, null, done);
        });

        it('should proxy `routeKey` when supplied', (done) => {

            Assertions.assertSend(instance, message, queueName, null, null, 'event1', done);
        });

        it('should proxy `routeKey` when supplied', (done) => {

            Assertions.assertSend(instance, messageWithEvent, queueName, null, null, null, done);
        });
    });

    describe('getAll', () => {

        const queueName = 'test-get-all-queue-1';
        const message = { name : 'bunnybus' };

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        afterEach((done) => {

            instance.deleteQueue(queueName, done);
        });

        it('should retrieve all message without meta flag', (done) => {

            Assertions.assertGetAll(instance, message, queueName, false, 10, done);
        });

        it('should retrieve all message with meta flag', (done) => {

            Assertions.assertGetAll(instance, message, queueName, true, 10, done);
        });
    });

    describe('publish', () => {

        const queueName = 'test-publish-queue-1';
        const message = { name : 'bunnybus' };
        const patterns = ['a', 'a.b', 'b', 'b.b', 'z.*'];

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.createExchange.bind(instance, instance.config.globalExchange, 'topic'),
                instance.createQueue.bind(instance, queueName),
                (result, cb) => {

                    Async.map(
                        patterns,
                        (item, mapCB) => {

                            instance.channel.bindQueue(queueName, instance.config.globalExchange, item, null, mapCB);
                        },
                        cb);
                }
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should publish for route `a`', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'a', null, null, true, done);
        });

        it('should publish for route `a.b`', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'a.b', null, null, true, done);
        });

        it('should publish for route `b`', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'b', null, null, true, done);
        });

        it('should publish for route `b.b`', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'b.b', null, null, true, done);
        });

        it('should publish for route `z.a`', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'z.a', null, null, true, done);
        });

        it('should publish for route `z` but not route to queue', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'z', null, null, false, done);
        });

        it('should proxy `source` when supplied', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'a', null, 'someModule', true, done);
        });

        it('should proxy `transactionId` when supplied', (done) => {

            Assertions.assertPublish(instance, message, queueName, 'a', 'someTransactionId', null, true, done);
        });

        it('should publish for route `a` when route key is provided in the message', (done) => {

            const messageWithRoute = Object.assign({}, message, { event : 'a' });
            Assertions.assertPublish(instance, messageWithRoute, queueName, null, null, null, true, done);
        });
    });

    describe('subscribe / unsubscribe (single queue)', () => {

        const queueName = 'test-subscribe-queue-1';
        const errorQueueName = `${queueName}_error`;
        const publishOptions = { routeKey : 'a.b' };
        const subscribeOptionsWithMeta = { meta : true };
        const messageObject = { event : 'a.b', name : 'bunnybus' };
        const messageString = 'bunnybus';
        const messageBuffer = new Buffer(messageString);

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        afterEach((done) => {

            instance.unsubscribe(queueName, done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        it('should consume message (Object) from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[messageObject.event] = (consumedMessage, ack) => {

                expect(consumedMessage).to.be.equal(messageObject);
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, messageObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Object) and meta from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[messageObject.event] = (consumedMessage, meta, ack) => {

                expect(consumedMessage).to.equal(messageObject);
                expect(meta).to.not.be.a.function();
                expect(meta.headers).to.exist();
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, subscribeOptionsWithMeta),
                instance.publish.bind(instance, messageObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (String) from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[publishOptions.routeKey] = (consumedMessage, ack) => {

                expect(consumedMessage).to.be.equal(messageString);
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, messageString, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (String) and meta from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[publishOptions.routeKey] = (consumedMessage, meta, ack) => {

                expect(consumedMessage).to.equal(messageString);
                expect(meta).to.not.be.a.function();
                expect(meta.headers).to.exist();
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, subscribeOptionsWithMeta),
                instance.publish.bind(instance, messageString, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[publishOptions.routeKey] = (consumedMessage, ack) => {

                expect(consumedMessage).to.be.equal(messageBuffer);
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, messageBuffer, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Buffer) and meta from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[publishOptions.routeKey] = (consumedMessage, meta, ack) => {

                expect(consumedMessage).to.equal(messageBuffer);
                expect(meta).to.not.be.a.function();
                expect(meta.headers).to.exist();
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, subscribeOptionsWithMeta),
                instance.publish.bind(instance, messageBuffer, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Object) from queue and reject off', (done) => {

            const handlers = {};
            handlers[messageObject.event] = (consumedMessage, ack, reject) => {

                expect(consumedMessage).to.be.equal(messageObject);

                Async.waterfall([
                    (cb) => reject(null, cb),
                    (cb) => instance.get(errorQueueName, null, cb),
                    (payload, cb) => {

                        expect(payload).to.exist();
                        const errorMessage = JSON.parse(payload.content.toString());
                        expect(errorMessage).to.be.equal(messageObject);
                        expect(payload.properties.headers.isBuffer).to.be.false();
                        cb();
                    }
                ], done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, messageObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and reject off', (done) => {

            const handlers = {};
            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject) => {

                expect(consumedMessage).to.be.equal(messageBuffer);

                Async.waterfall([
                    (cb) => reject(null, cb),
                    (cb) => instance.get(errorQueueName, null, cb),
                    (payload, cb) => {

                        expect(payload).to.exist();
                        const errorMessage = payload.content;
                        expect(errorMessage).to.be.equal(messageBuffer);
                        expect(payload.properties.headers.isBuffer).to.be.true();
                        cb();
                    }
                ], done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, messageBuffer, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Object) from queue and requeue off on maxRetryCount', { timeout : 0 }, (done) => {

            const handlers = {};
            const maxRetryCount = 3;
            let retryCount = 0;
            handlers[messageObject.event] = (consumedMessage, ack, reject, requeue) => {

                ++retryCount;

                if (retryCount < maxRetryCount) {
                    requeue(() => { });
                }
                else {
                    expect(consumedMessage).to.be.equal(messageObject);
                    expect(retryCount).to.be.equal(maxRetryCount);
                    ack(done);
                }
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, { maxRetryCount }),
                instance.publish.bind(instance, messageObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and requeue off on maxRetryCount', { timeout : 0 }, (done) => {

            const handlers = {};
            const maxRetryCount = 3;
            let retryCount = 0;
            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject, requeue) => {

                ++retryCount;

                if (retryCount < maxRetryCount) {
                    requeue(() => { });
                }
                else {
                    expect(consumedMessage).to.be.equal(messageBuffer);
                    expect(retryCount).to.be.equal(maxRetryCount);
                    ack(done);
                }
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, { maxRetryCount }),
                instance.publish.bind(instance, messageBuffer, publishOptions)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });

        it('should reject message without bunnyBus header property', (done) => {

            const handlers = {};
            const config = instance.config;
            const headers = {
                headers : {
                    transactionId : '1234abcd',
                    isBuffer      : false,
                    routeKey      : publishOptions.routeKey,
                    createAt      : (new Date()).toISOString()
                }
            };

            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject, requeue) => {

                //this should never be called.
                ack(done);
            };

            instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {

                expect(message).to.be.equal('message not of BunnyBus origin');
                done();
            });

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                (cb) => instance.channel.publish(config.globalExchange, publishOptions.routeKey, new Buffer(JSON.stringify(messageObject)), headers, cb)
            ],
            () => {});
        });

        it('should reject message with mismatched version', (done) => {

            const handlers = {};
            const config = instance.config;
            const version = '0.0.1';
            const headers = {
                headers : {
                    transactionId : '1234abcd',
                    isBuffer      : false,
                    routeKey      : publishOptions.routeKey,
                    createAt      : (new Date()).toISOString(),
                    bunnyBus      : version
                }
            };

            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject, requeue) => {

                //this should never be called.
                ack(done);
            };

            instance.once(BunnyBus.LOG_WARN_EVENT, (message) => {

                expect(message).to.be.equal(`message came from older bunnyBus version (${version})`);
                done();
            });

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                (cb) => instance.channel.publish(config.globalExchange, publishOptions.routeKey, new Buffer(JSON.stringify(messageObject)), headers, cb)
            ],
            () => {});
        });

        it('should accept message without bunnyBus header when overridden', (done) => {

            const handlers = {};
            const validatePublisher = false;
            const config = instance.config;
            const headers = {
                headers : {
                    transactionId : '1234abcd',
                    isBuffer      : false,
                    routeKey      : publishOptions.routeKey,
                    createAt      : (new Date()).toISOString()
                }
            };

            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject, requeue) => {

                //this should never be called.
                ack(done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, { validatePublisher }),
                (cb) => instance.channel.publish(config.globalExchange, publishOptions.routeKey, new Buffer(JSON.stringify(messageObject)), headers, cb)
            ],
            () => {});
        });

        it('should accept message with bunnyBus header with mismatched version when overriden', (done) => {

            const handlers = {};
            const validateVersion = false;
            const config = instance.config;
            const version = '0.0.1';
            const headers = {
                headers : {
                    transactionId : '1234abcd',
                    isBuffer      : false,
                    routeKey      : publishOptions.routeKey,
                    createAt      : (new Date()).toISOString(),
                    bunnyBus      : version
                }
            };

            handlers[publishOptions.routeKey] = (consumedMessage, ack, reject, requeue) => {

                //this should never be called.
                ack(done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers, { validateVersion }),
                (cb) => instance.channel.publish(config.globalExchange, publishOptions.routeKey, new Buffer(JSON.stringify(messageObject)), headers, cb)
            ],
            () => {});
        });
    });

    describe('subscribe / unsubscribe (single queue with * route)', () => {

        const queueName = 'test-subscribe-queue-with-star-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.*.xyz';
        const routableObject = { event : 'abc.helloworld.xyz', name : 'bunnybus' };

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        afterEach((done) => {

            instance.unsubscribe(queueName, done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        it('should consume message (Object) from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[subscriptionKey] = (consumedMessage, ack) => {

                expect(consumedMessage).to.be.equal(routableObject);
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, routableObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });
    });

    describe('subscribe / unsubscribe (single queue with # route)', () => {

        const queueName = 'test-subscribe-queue-with-hash-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.#.xyz';
        const routableObject = { event : 'abc.hello.world.xyz', name : 'bunnybus' };

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        afterEach((done) => {

            instance.unsubscribe(queueName, done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        it('should consume message (Object) from queue and acknowledge off', (done) => {

            const handlers = {};
            handlers[subscriptionKey] = (consumedMessage, ack) => {

                expect(consumedMessage).to.be.equal(routableObject);
                ack(null, done);
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName, handlers),
                instance.publish.bind(instance, routableObject)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });
    });

    describe('subscribe / unsubscribe (multiple queue)', () => {

        const queueName1 = 'test-subscribe-multiple-queue-1';
        const queueName2 = 'test-subscribe-multiple-queue-2';
        const message = { event : 'a.b', name : 'bunnybus' };

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName1),
                instance.deleteQueue.bind(instance, queueName2)
            ], done);
        });

        afterEach((done) => {

            Async.parallel([
                instance.unsubscribe.bind(instance, queueName1),
                instance.unsubscribe.bind(instance, queueName2)
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName1),
                instance.deleteQueue.bind(instance, queueName2)
            ], done);
        });

        it('should consume message from two queues and acknowledge off', (done) => {

            const handlers = {};
            let counter = 0;

            handlers[message.event] = (consumedMessage, ack, reject, requeue) => {

                expect(consumedMessage.name).to.be.equal(message.name);
                ack(() => {

                    ++counter;
                    if (counter === 2) {
                        done();
                    }
                });
            };

            Async.waterfall([
                instance.subscribe.bind(instance, queueName1, handlers),
                instance.subscribe.bind(instance, queueName2, handlers),
                instance.publish.bind(instance, message)
            ],
            (err) => {

                if (err) {
                    done(err);
                }
            });
        });
    });

    describe('_ack', () => {

        const queueName = 'test-acknowledge-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.createExchange.bind(instance, instance.config.globalExchange, 'topic'),
                instance.createQueue.bind(instance, queueName),
                (result, cb) => {

                    Async.map(
                        patterns,
                        (item, mapCB) => {

                            instance.channel.bindQueue(queueName, instance.config.globalExchange, item, null, mapCB);
                        },
                        cb);
                }
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should ack a message off the queue', (done) => {

            Async.waterfall([
                instance.publish.bind(instance, message),
                instance.get.bind(instance, queueName),
                (payload, cb) => {

                    instance._ack(payload, cb);
                },
                instance.checkQueue.bind(instance, queueName),
                (result, cb) => {

                    expect(result.queue).to.be.equal(queueName);
                    expect(result.messageCount).to.be.equal(0);
                    cb();
                }
            ], done);
        });
    });

    describe('_requeue', () => {

        const queueName = 'test-requeue-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        beforeEach((done) => {

            instance.channel.purgeQueue(queueName, done);
        });

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.createExchange.bind(instance, instance.config.globalExchange, 'topic'),
                instance.createQueue.bind(instance, queueName),
                (result, cb) => {

                    Async.map(
                        patterns,
                        (item, mapCB) => {

                            instance.channel.bindQueue(queueName, instance.config.globalExchange, item, null, mapCB);
                        },
                        cb);
                }
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should requeue a message off the queue', (done) => {

            Async.waterfall([
                instance.publish.bind(instance, message),
                instance.get.bind(instance, queueName),
                (payload, cb) => {

                    instance._requeue(payload, queueName, cb);
                },
                instance.checkQueue.bind(instance, queueName)
            ], (err, result) => {

                expect(err).to.not.exist();
                expect(result.queue).to.be.equal(queueName);
                expect(result.messageCount).to.be.equal(1);
                done();
            });
        });

        it('should requeue with well formed header properties', (done) => {

            const publishOptions = {
                source : 'test'
            };

            let transactionId = null;
            let createdAt = null;

            Async.waterfall([
                instance.publish.bind(instance, message, publishOptions),
                instance.get.bind(instance, queueName),
                (payload, cb) => {

                    transactionId = payload.properties.headers.transactionId;
                    createdAt = payload.properties.headers.createdAt;
                    instance._requeue(payload, queueName, cb);
                },
                instance.get.bind(instance, queueName)
            ], (err, payload) => {

                expect(err).to.not.exist();
                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
                expect(payload.properties.headers.createdAt).to.be.equal(createdAt);
                expect(payload.properties.headers.source).to.be.equal(publishOptions.source);
                expect(payload.properties.headers.requeuedAt).to.exist();
                expect(payload.properties.headers.retryCount).to.be.equal(1);
                expect(payload.properties.headers.routeKey).to.be.equal(message.event);
                expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../package.json').version);
                done();
            });
        });
    });

    describe('_reject', () => {

        const errorQueueName = 'test-reject-error-queue-1';
        const queueName = 'test-reject-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        beforeEach((done) => {

            instance.channel.purgeQueue(queueName, done);
        });

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.createExchange.bind(instance, instance.config.globalExchange, 'topic'),
                instance.createQueue.bind(instance, queueName),
                (result, cb) => {

                    Async.map(
                        patterns,
                        (item, mapCB) => {

                            instance.channel.bindQueue(queueName, instance.config.globalExchange, item, null, mapCB);
                        },
                        cb);
                }
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        afterEach((done) => {

            instance.deleteQueue(errorQueueName, done);
        });

        it('should reject a message off the queue', (done) => {

            Async.waterfall([
                instance.publish.bind(instance, message),
                instance.get.bind(instance, queueName),
                (payload, cb) => {

                    instance._reject(payload, errorQueueName, cb);
                },
                instance.checkQueue.bind(instance, errorQueueName)
            ], (err, result) => {

                expect(err).to.not.exist();
                expect(result.queue).to.be.equal(errorQueueName);
                expect(result.messageCount).to.be.equal(1);
                done();
            });
        });

        it('should reject with well formed header properties', (done) => {

            const publishOptions = {
                source : 'test'
            };
            const requeuedAt = (new Date()).toISOString();
            const retryCount = 5;
            let transactionId = null;
            let createdAt = null;

            Async.waterfall([
                instance.publish.bind(instance, message, publishOptions),
                instance.get.bind(instance, queueName),
                (payload, cb) => {

                    transactionId = payload.properties.headers.transactionId;
                    createdAt = payload.properties.headers.createdAt;
                    payload.properties.headers.requeuedAt = requeuedAt;
                    payload.properties.headers.retryCount = retryCount;
                    instance._reject(payload, errorQueueName, cb);
                },
                instance.get.bind(instance, errorQueueName)
            ], (err, payload) => {

                expect(err).to.not.exist();
                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
                expect(payload.properties.headers.createdAt).to.be.equal(createdAt);
                expect(payload.properties.headers.source).to.be.equal(publishOptions.source);
                expect(payload.properties.headers.requeuedAt).to.be.equal(requeuedAt);
                expect(payload.properties.headers.retryCount).to.be.equal(retryCount);
                expect(payload.properties.headers.erroredAt).to.exist();
                expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../package.json').version);
                done();
            });
        });
    });
});

describe('negative integration tests', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('channel', () => {

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoConnectionError when connection does not pre-exist', (done) => {

            instance._createChannel((err) => {

                expect(err).to.be.an.error(Exceptions.NoConnectionError);
                done();
            });
        });
    });

    describe('queue', () => {

        const queueName = 'test-queue-1';

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling createQueue and connection does not pre-exist', (done) => {

            instance.createQueue(queueName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });

        it('should throw NoChannelError when calling checkQueue and connection does not pre-exist', (done) => {

            instance.checkQueue(queueName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });

        it('should throw NoChannelError when calling deleteQueue and connection does not pre-exist', (done) => {

            instance.deleteQueue(queueName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('exchange', () => {

        const exchangeName = 'test-exchange-1';

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling createExchange and connection does not pre-exist', (done) => {

            instance.createExchange(exchangeName, '', (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });

        it('should throw NoChannelError when calling checkExchange and connection does not pre-exist', (done) => {

            instance.checkExchange(exchangeName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });

        it('should throw NoChannelError when calling deleteExchange and connection does not pre-exist', (done) => {

            instance.deleteExchange(exchangeName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('get', () => {

        const queueName = 'test-queue-1';

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling get and connection does not pre-exist', (done) => {

            instance.get(queueName, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('publish', () => {

        const message = { name : 'bunnybus' };

        it('should throw NoRouteKeyError when calling publish and `options.routeKey` nor `message.event` exist', (done) => {

            instance.publish(message, (err) => {

                expect(err).to.be.an.error(Exceptions.NoRouteKeyError);
                done();
            });
        });
    });

    describe('subscribe', () => {

        const queueName = 'test-queue-1';
        const consumerTag = 'abcde12345';
        const handlers = { event1 : () => {} };

        afterEach((done) => {

            instance.subscriptions._subscriptions.clear();
            instance.subscriptions._blockQueues.clear();
            done();
        });

        it('should throw SubscriptionExistError when calling subscribe on an active subscription exist', (done) => {

            instance.subscriptions.create(queueName, handlers);
            instance.subscriptions.tag(queueName, consumerTag);

            instance.subscribe(queueName, handlers, (err) => {

                expect(err).to.be.an.error(Exceptions.SubscriptionExistError);
                done();
            });
        });

        it('should throw SubscriptionBlockedError when calling subscribe against a blocked queue', (done) => {

            instance.subscriptions.block(queueName);

            instance.subscribe(queueName, handlers, (err) => {

                expect(err).to.be.an.error(Exceptions.SubscriptionBlockedError);
                done();
            });
        });
    });

    describe('acknowledge', () => {

        const payload = {
            content : new Buffer('hello')
        };

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling _ack and connection does not pre-exist', (done) => {

            instance._ack(payload, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('requeue', () => {

        const payload = {
            content : new Buffer('hello')
        };

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling _requeue and connection does not pre-exist', (done) => {

            instance._requeue(payload, '', (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('reject', () => {

        const payload = {
            content : new Buffer('hello')
        };

        beforeEach((done) => {

            instance._closeConnection(done);
        });

        it('should throw NoChannelError when calling _reject and connection does not pre-exist', (done) => {

            instance._reject(payload, '', (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });
});
