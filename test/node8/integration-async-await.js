'use strict';

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

const throwError = () => {

    throw new Error('Test should not have reached the .then block');
};

describe('positive integration tests - async/await with Promise api', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('connection', () => {

        before(() => {

            return instance._closeConnection();
        });

        afterEach(() => {

            return instance._closeConnection();
        });

        it('should create connection with default values', async () => {

            await instance._createConnection();

            expect(instance.connection).to.not.be.null();
        });

        it('should close an opened connection', async () => {

            await instance._createConnection();
            await instance._closeConnection();

            expect(instance.connection).to.not.exist();
        });
    });

    describe('channel', () => {

        before(() => {

            return instance._closeChannel();
        });

        beforeEach(() => {

            return instance._closeChannel()
                .then(instance._createConnection);
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

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should create connection and channel', async () => {

            await instance._autoConnectChannel();

            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });

        it('should create connection and channel properly with no race condition', async () => {

            await Promise.all([
                instance._autoConnectChannel(),
                instance._autoConnectChannel(),
                instance._autoConnectChannel(),
                instance._autoConnectChannel()
            ]);

            expect(instance.connection).to.exist();
            expect(instance.channel).to.exist();
        });
    });

    describe('_recoverConnectChannel', () => {

        beforeEach(() => {

            return instance._autoConnectChannel();
        });

        afterEach(() => {

            return instance._closeConnection();
        });

        it('should recreate connection when connection error occurs', (done) => {

            instance.connection.emit('error');

            setTimeout(() => {

                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            }, 100);
        });

        it('should recreate connection when channel error occurs', (done) => {

            instance.channel.emit('error');

            setTimeout(() => {

                expect(instance.connection).to.exist();
                expect(instance.channel).to.exist();
                done();
            }, 100);
        });
    });

    describe('queue', () => {

        const queueName = 'test-queue-1';

        beforeEach(() => {

            return instance._autoConnectChannel();
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
            return instance.deleteExchange(exchangeName);
        });

        beforeEach(() => {

            return instance._autoConnectChannel();
        });

        it('should create exchange with name `test-exchange-1`', () => {

            return instance.createExchange(exchangeName, 'topic');
        });

        it('should check exchange with name `test-exchange-1`', () => {

            return instance.checkExchange(exchangeName);
        });

        it('should delete exchange with name `test-exchange-1`', () => {

            return instance.deleteExchange(exchangeName);
        });
    });

    describe('send / get', () => {

        const queueName = 'test-send-queue-1';
        const message = { name : 'bunnybus' };
        const messageWithEvent = { event : 'event1', name : 'bunnybus' };

        beforeEach(() => {

            return instance._closeConnection();
        });

        afterEach(() => {

            return instance.deleteQueue(queueName);
        });

        it('should send message', async () => {

            return Assertions.assertAsyncAwait(instance, message, queueName, null, null, null);
        });

        it('should send message when miscellaneous amqplib options are included', async () => {

            const amqpOptions = {
                expiration: '1000',
                userId: 'guest',
                CC: 'a',
                priority: 1,
                persistent: false,
                deliveryMode: false,
                mandatory:false,
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

            return Assertions.assertAsyncAwait(instance, message, queueName, null, null, null, amqpOptions);
        });

        it('should proxy `source` when supplied', async () => {

            return Assertions.assertAsyncAwait(instance, message, queueName, null, 'someModule', null);
        });

        it('should proxy `transactionId` when supplied', async () => {

            return Assertions.assertAsyncAwait(instance, message, queueName, 'someTransactionId', null, null);
        });

        it('should proxy `routeKey` when supplied', async () => {

            return Assertions.assertAsyncAwait(instance, message, queueName, null, null, 'event1');
        });

        it('should proxy `routeKey` when supplied', async () => {

            return Assertions.assertAsyncAwait(instance, messageWithEvent, queueName, null, null, null);
        });
    });

    describe('getAll', () => {

        const queueName = 'test-get-all-queue-1';
        const message = { name : 'bunnybus' };

        beforeEach(() => {

            return instance._closeConnection();
        });

        afterEach(() => {

            return instance.deleteQueue(queueName);
        });

        it('should retrieve all message without meta flag', async () => {

            return Assertions.assertGetAllAsyncAwait(instance, message, queueName, false, 10);
        });

        it('should retrieve all message with meta flag', async () => {

            return Assertions.assertGetAllAsyncAwait(instance, message, queueName, true, 10);
        });
    });

    describe('publish', () => {

        const queueName = 'test-publish-queue-1';
        const message = { name : 'bunnybus' };
        const patterns = ['a', 'a.b', 'b', 'b.b', 'z.*'];

        before(async () => {

            await instance._autoConnectChannel();
            await instance.createExchange(instance.config.globalExchange, 'topic');
            await instance.createQueue(queueName);

            const promises = patterns.map((pattern) => {

                return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
            });

            return Promise.all(promises);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            return instance.deleteQueue(queueName);
        });

        it('should publish for route `a`', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'a', null, null, true);
        });

        it('should publish for route `a` when miscellaneous amqplib options are included', async () => {

            const amqpOptions = {
                expiration: '1000',
                userId: 'guest',
                CC: 'a',
                priority: 1,
                persistent: false,
                deliveryMode: false,
                mandatory:false,
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

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'a', null, null, true, amqpOptions);
        });

        it('should publish for route `a.b`', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'a.b', null, null, true);
        });

        it('should publish for route `b`', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'b', null, null, true);
        });

        it('should publish for route `b.b`', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'b.b', null, null, true);
        });

        it('should publish for route `z.a`', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'z.a', null, null, true);
        });

        it('should publish for route `z` but not route to queue', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'z', null, null, false);
        });

        it('should proxy `source` when supplied', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'a', null, 'someModule', true);
        });

        it('should proxy `transactionId` when supplied', async () => {

            return Assertions.assertPublishAsyncAwait(instance, message, queueName, 'a', 'someTransactionId', null, true);
        });

        it('should publish for route `a` when route key is provided in the message', async () => {

            const messageWithRoute = Object.assign({}, message, { event : 'a' });

            return Assertions.assertPublishAsyncAwait(instance, messageWithRoute, queueName, null, null, null, true);
        });
    });

    describe('subscribe / unsubscribe (single queue)', () => {

        const queueName = 'test-subscribe-queue-1';
        const errorQueueName = `${queueName}_error`;
        const publishOptions = { routeKey : 'a.b' };
        const subscribeOptions = { meta : true };
        const messageObject = { event : 'a.b', name : 'bunnybus' };
        const messageString = 'bunnybus';
        const messageBuffer = Buffer.from(messageString);

        before(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        afterEach(() => {

            return instance.unsubscribe(queueName);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[messageObject.event] = async (consumedMessage, ack) => {

                    expect(consumedMessage).to.be.equal(messageObject);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(messageObject);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Object) and meta from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[messageObject.event] = async (consumedMessage, meta, ack) => {

                    expect(consumedMessage).to.equal(messageObject);
                    expect(meta).to.not.be.a.function();
                    expect(meta.headers).to.exist();

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers, subscribeOptions);
                    await instance.publish(messageObject);
                }
                catch (err) {
                    reject(err);
                }

            });
        });

        it('should consume message (String) from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                    expect(consumedMessage).to.be.equal(messageString);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(messageString, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (String) and meta from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[publishOptions.routeKey] = async (consumedMessage, meta, ack) => {

                    expect(consumedMessage).to.equal(messageString);
                    expect(meta).to.not.be.a.function();
                    expect(meta.headers).to.exist();

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers, subscribeOptions);
                    await instance.publish(messageString, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[publishOptions.routeKey] = async (consumedMessage, ack) => {

                    expect(consumedMessage).to.be.equal(messageBuffer);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(messageBuffer, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Buffer) and meta from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[publishOptions.routeKey] = async (consumedMessage, meta, ack) => {

                    expect(consumedMessage).to.equal(messageBuffer);
                    expect(meta).to.not.be.a.function();
                    expect(meta.headers).to.exist();

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers, subscribeOptions);
                    await instance.publish(messageBuffer, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Object) from queue and reject off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[messageObject.event] = async (consumedMessage, ack, rej) => {

                    expect(consumedMessage).to.be.equal(messageObject);

                    await rej();
                    const payload = await instance.get(errorQueueName);

                    expect(payload).to.exist();
                    const errorMessage = JSON.parse(payload.content.toString());
                    expect(errorMessage).to.be.equal(messageObject);
                    expect(payload.properties.headers.isBuffer).to.be.false();

                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(messageObject);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and reject off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[publishOptions.routeKey] = async (consumedMessage, ack, rej) => {

                    expect(consumedMessage).to.be.equal(messageBuffer);

                    await rej();
                    const payload = await instance.get(errorQueueName);

                    expect(payload).to.exist();
                    const errorMessage = payload.content;
                    expect(errorMessage).to.be.equal(messageBuffer);
                    expect(payload.properties.headers.isBuffer).to.be.true();

                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(messageBuffer, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Object) from queue and requeue off on maxRetryCount', { timeout : 0 }, async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};
                const maxRetryCount = 3;
                let retryCount = 0;
                handlers[messageObject.event] = async (consumedMessage, ack, rej, requeue) => {

                    ++retryCount;

                    if (retryCount < maxRetryCount) {
                        return requeue();
                    }

                    expect(consumedMessage).to.be.equal(messageObject);
                    expect(retryCount).to.be.equal(maxRetryCount);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers, { maxRetryCount });
                    await instance.publish(messageObject);
                }
                catch (err) {
                    reject(err);
                }
            });
        });

        it('should consume message (Buffer) from queue and requeue off on maxRetryCount', { timeout : 0 }, async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};
                const maxRetryCount = 3;
                let retryCount = 0;
                handlers[publishOptions.routeKey] = async (consumedMessage, ack, rej, requeue) => {

                    ++retryCount;

                    if (retryCount < maxRetryCount) {
                        return requeue();
                    }

                    expect(consumedMessage).to.be.equal(messageBuffer);
                    expect(retryCount).to.be.equal(maxRetryCount);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers, { maxRetryCount });
                    await instance.publish(messageBuffer, publishOptions);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });

    describe('subscribe / unsubscribe (single queue with * route)', () => {

        const queueName = 'test-subscribe-queue-with-star-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.*.xyz';
        const routableObject = { event : 'abc.helloworld.xyz', name : 'bunnybus' };

        before(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        afterEach(() => {

            return instance.unsubscribe(queueName);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[subscriptionKey] = async (consumedMessage, ack) => {

                    expect(consumedMessage).to.be.equal(routableObject);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(routableObject);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });

    describe('subscribe / unsubscribe (single queue with * route)', () => {

        const queueName = 'test-subscribe-queue-with-hash-routing-1';
        const errorQueueName = `${queueName}_error`;
        const subscriptionKey = 'abc.#.xyz';
        const routableObject = { event : 'abc.hello.world.xyz', name : 'bunnybus' };

        before(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        afterEach(() => {

            return instance.unsubscribe(queueName);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName);
            return instance.deleteQueue(errorQueueName);
        });

        it('should consume message (Object) from queue and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};

                handlers[subscriptionKey] = async (consumedMessage, ack) => {

                    expect(consumedMessage).to.be.equal(routableObject);

                    await ack();
                    resolve();
                };

                try {
                    await instance.subscribe(queueName, handlers);
                    await instance.publish(routableObject);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });

    describe('subscribe / unsubscribe (multiple queue)', () => {

        const queueName1 = 'test-subscribe-multiple-queue-1';
        const queueName2 = 'test-subscribe-multiple-queue-2';
        const message = { event : 'a.b', name : 'bunnybus' };

        before(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName1);
            return instance.deleteQueue(queueName2);
        });

        afterEach(() => {

            return Promise.all([
                instance.unsubscribe(queueName1),
                instance.unsubscribe(queueName2)
            ]);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            await instance.deleteQueue(queueName1);
            return instance.deleteQueue(queueName2);
        });

        it('should consume message from two queues and acknowledge off', async () => {

            return new Promise(async (resolve, reject) => {

                const handlers = {};
                let counter = 0;

                handlers[message.event] = async (consumedMessage, ack) => {

                    expect(consumedMessage.name).to.be.equal(message.name);

                    await ack();

                    ++counter;
                    if (counter === 2) {
                        resolve();
                    }
                };

                try {
                    await instance.subscribe(queueName1, handlers);
                    await instance.subscribe(queueName2, handlers);
                    await instance.publish(message);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });

    describe('_ack', () => {

        const queueName = 'test-acknowledge-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        before(async () => {

            await instance._autoConnectChannel();
            await instance.createExchange(instance.config.globalExchange, 'topic');
            await instance.createQueue(queueName);

            const promises = patterns.map((pattern) => {

                return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
            });

            return Promise.all(promises);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            return instance.deleteQueue(queueName);
        });

        it('should ack a message off the queue', async () => {

            await instance.publish(message);
            const payload = await instance.get(queueName);
            await instance._ack(payload);
            const result = await instance.checkQueue(queueName);

            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(0);
        });
    });

    describe('_requeue', () => {

        const queueName = 'test-requeue-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        beforeEach((done) => {

            instance.channel.purgeQueue(queueName, done);
        });

        before(async () => {

            await instance._autoConnectChannel();
            await instance.createExchange(instance.config.globalExchange, 'topic');
            await instance.createQueue(queueName);

            const promises = patterns.map((pattern) => {

                return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
            });

            return Promise.all(promises);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            return instance.deleteQueue(queueName);
        });

        it('should requeue a message off the queue', async () => {

            await instance.publish(message);
            const payload = await instance.get(queueName);
            await instance._requeue(payload, queueName);
            const result = await  instance.checkQueue(queueName);

            expect(result.queue).to.be.equal(queueName);
            expect(result.messageCount).to.be.equal(1);
        });

        it('should requeue with well formed header properties', async () => {

            const publishOptions = {
                source : 'test'
            };

            let transactionId = null;
            let createdAt = null;

            await instance.publish(message, publishOptions);
            let payload = await instance.get(queueName);

            transactionId = payload.properties.headers.transactionId;
            createdAt = payload.properties.headers.createdAt;

            await instance._requeue(payload, queueName);

            payload = await instance.get(queueName);

            expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
            expect(payload.properties.headers.createdAt).to.be.equal(createdAt);
            expect(payload.properties.headers.source).to.be.equal(publishOptions.source);
            expect(payload.properties.headers.requeuedAt).to.exist();
            expect(payload.properties.headers.retryCount).to.be.equal(1);
            expect(payload.properties.headers.routeKey).to.be.equal(message.event);
            expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../package.json').version);
        });
    });

    describe('_reject', async () => {

        const errorQueueName = 'test-reject-error-queue-1';
        const queueName = 'test-reject-queue-1';
        const message = { name : 'bunnybus', event : 'a' };
        const patterns = ['a'];

        beforeEach((done) => {

            instance.channel.purgeQueue(queueName, done);
        });

        before(async () => {

            await instance._autoConnectChannel();
            await instance.createExchange(instance.config.globalExchange, 'topic');
            await instance.createQueue(queueName);

            const promises = patterns.map((pattern) => {

                return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
            });

            return Promise.all(promises);
        });

        after(async () => {

            await instance._autoConnectChannel();
            await instance.deleteExchange(instance.config.globalExchange);
            return instance.deleteQueue(queueName);
        });

        afterEach(() => {

            return instance.deleteQueue(errorQueueName);
        });

        it('should reject a message off the queue', async () => {

            await instance.publish(message);
            const payload = await instance.get(queueName);
            await instance._reject(payload, errorQueueName);
            const result = await instance.checkQueue(errorQueueName);

            expect(result.queue).to.be.equal(errorQueueName);
            expect(result.messageCount).to.be.equal(1);
        });

        it('should requeue with well formed header properties', async () => {

            const publishOptions = {
                source : 'test'
            };
            const requeuedAt = (new Date()).toISOString();
            const retryCount = 5;
            let transactionId = null;
            let createdAt = null;

            await instance.publish(message, publishOptions);
            let payload = await instance.get(queueName);

            transactionId = payload.properties.headers.transactionId;
            createdAt = payload.properties.headers.createdAt;
            payload.properties.headers.requeuedAt = requeuedAt;
            payload.properties.headers.retryCount = retryCount;

            await instance._reject(payload, errorQueueName);

            payload = await instance.get(errorQueueName);

            expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
            expect(payload.properties.headers.createdAt).to.be.equal(createdAt);
            expect(payload.properties.headers.source).to.be.equal(publishOptions.source);
            expect(payload.properties.headers.requeuedAt).to.be.equal(requeuedAt);
            expect(payload.properties.headers.retryCount).to.be.equal(retryCount);
            expect(payload.properties.headers.erroredAt).to.exist();
            expect(payload.properties.headers.bunnyBus).to.be.equal(require('../../package.json').version);
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

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoConnectionError when connection does not pre-exist', async () => {

            try {
                await instance._createChannel();
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoConnectionError);
            }
        });
    });

    describe('queue', () => {

        const queueName = 'test-queue-1';

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling createQueue and connection does not pre-exist', async () => {

            try {
                await instance.createQueue(queueName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });

        it('should throw NoChannelError when calling checkQueue and connection does not pre-exist', async () => {

            try {
                await instance.checkQueue(queueName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });

        it('should throw NoChannelError when calling deleteQueue and connection does not pre-exist', async () => {

            try {
                await instance.deleteQueue(queueName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });

    describe('exchange', () => {

        const exchangeName = 'test-exchange-1';

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling createExchange and connection does not pre-exist', async () => {

            try {
                await instance.createExchange(exchangeName, '');
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });

        it('should throw NoChannelError when calling checkExchange and connection does not pre-exist', async () => {

            try {
                await instance.checkExchange(exchangeName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });

        it('should throw NoChannelError when calling deleteExchange and connection does not pre-exist', async () => {

            try {
                await instance.deleteExchange(exchangeName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });

    describe('get', () => {

        const queueName = 'test-queue-1';

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling get and connection does not pre-exist', async () => {

            try {
                await instance.get(queueName);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });

    describe('publish', () => {

        const message = { name : 'bunnybus' };

        it('should throw NoRouteKeyError when calling publish and `options.routeKey` nor `message.event` exist', async () => {

            try {
                await instance.publish(message);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoRouteKeyError);
            }
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

        it('should throw SubscriptionExistError when calling subscribe on an active subscription exist', async () => {

            instance.subscriptions.create(queueName, handlers);
            instance.subscriptions.tag(queueName, consumerTag);

            try {
                await instance.subscribe(queueName, handlers);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.SubscriptionExistError);
            }
        });

        it('should throw SubscriptionBlockedError when calling subscribe against a blocked queue', async () => {

            instance.subscriptions.block(queueName);

            try {
                await instance.subscribe(queueName, handlers);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.SubscriptionBlockedError);
            }
        });
    });

    describe('acknowledge', () => {

        const payload = {
            content : Buffer.from('hello')
        };

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling _ack and connection does not pre-exist', async () => {

            try {
                await instance._ack(payload);
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });

    describe('requeue', () => {

        const payload = {
            content : Buffer.from('hello')
        };

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling _requeue and connection does not pre-exist', async () => {

            try {
                await instance._requeue(payload, '');
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });

    describe('reject', () => {

        const payload = {
            content : Buffer.from('hello')
        };

        beforeEach(() => {

            return instance._closeConnection();
        });

        it('should throw NoChannelError when calling _reject and connection does not pre-exist', async () => {

            try {
                await instance._reject(payload, '');
                return throwError();
            }
            catch (err) {
                expect(err).to.be.an.error(Exceptions.NoChannelError);
            }
        });
    });
});
