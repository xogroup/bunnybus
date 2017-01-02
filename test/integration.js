'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');
const Exceptions = require('../lib/exceptions');

const lab = exports.lab = Lab.script();
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');
let instance = undefined;

describe('positive integration tests', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('connection', () => {

        before((done) => {

            instance.closeConnection(done);
        });

        afterEach((done) => {

            instance.closeConnection(done);
        });

        it('should create connection with default values', (done) => {

            instance.createConnection((err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.exist();
                done();
            });
        });

        it('should close an opened connection', (done) => {

            Async.waterfall([
                instance.createConnection,
                instance.closeConnection
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.be.null();
                done(err);
            });
        });
    });

    describe('channel', () => {

        before((done) => {

            instance.closeChannel(done);
        });

        beforeEach((done) => {

            instance.createConnection(done);
        });

        afterEach((done) => {

            instance.closeChannel(done);
        });

        it('should create channel with default values', (done) => {

            instance.createChannel((err) => {

                expect(err).to.be.null();
                expect(instance.channel).to.exist();
                done();
            });
        });

        it('should close an opened channel', (done) => {

            Async.waterfall([
                instance.createChannel,
                instance.closeChannel
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.channel).to.be.null();
                done(err);
            });
        });

        it('should close both connection and channel when closing a connection', (done) => {

            Async.waterfall([
                instance.createChannel,
                instance.closeConnection
            ], (err) => {

                expect(err).to.be.null();
                expect(instance.connection).to.be.null();
                expect(instance.channel).to.be.null();
                done(err);
            });
        });
    });

    describe('_autoConnectChannel', () => {

        beforeEach((done) => {

            instance.closeConnection(done);
        });

        it('should create connection and channel', (done) => {

            instance._autoConnectChannel((err) => {

                expect(err).to.be.null();
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

                expect(err).to.be.null();
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

            instance.closeConnection(done);
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

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        it('should create queue with name `test-queue-1`', (done) => {

            instance.createQueue(queueName, null, (err, result) => {

                expect(err).to.be.null();
                expect(result.queue).to.be.equal(queueName);
                expect(result.messageCount).to.be.equal(0);
                done();
            });
        });

        it('should check queue with name `test-queue-1`', (done) => {

            instance.checkQueue(queueName, (err, result) => {

                expect(err).to.be.null();
                expect(result.queue).to.be.equal(queueName);
                expect(result.messageCount).to.be.equal(0);
                done();
            });
        });

        it('should delete queue with name `test-queue-1`', (done) => {

            instance.deleteQueue(queueName, null, (err, result) => {

                expect(err).to.be.null();
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

                    instance.deleteExchange(exchangeName, null, cb);
                }
            ], done);
        });

        beforeEach((done) => {

            instance._autoConnectChannel(done);
        });

        it('should create exchange with name `test-exchange-1`', (done) => {

            instance.createExchange(exchangeName, 'topic', null, (err, result) => {

                expect(err).to.be.null();

                done();
            });
        });

        it('should check exchange with name `test-exchange-1`', (done) => {

            instance.checkExchange(exchangeName, (err, result) => {

                expect(err).to.be.null();
                done();
            });
        });

        it('should delete exchange with name `test-exchange-1`', (done) => {

            instance.deleteExchange(exchangeName, null, (err, result) => {

                expect(err).to.be.null();
                done();
            });
        });
    });

    describe('publish', () => {

        const queueName = 'test-publish-queue-1';
        const message = { name : 'bunnybus' };
        const patterns = ['a', 'a.b', 'a.c', 'b', 'b.b', 'z.*'];

        before((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.createExchange.bind(instance, instance.config.globalExchange, 'topic', null),
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
                instance.deleteExchange.bind(instance, instance.config.globalExchange, null),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should publish for route `a`', (done) => {

            Async.waterfall([
                instance.publish.bind(instance, message, { routeKey : 'a' }),
                (results, cb) => {

                    setTimeout(() => cb(), 40);
                },
                instance.channel.get.bind(instance.channel, queueName, null)
            ],
            (err, result) => {

                expect(err).to.be.null();
                expect(JSON.parse(result.content.toString()).message).to.equal(message);
                //still need to act this off the queue
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

            instance.closeConnection(done);
        });

        it('should throw NoConnectionError when connection does not pre-exist', (done) => {

            instance.createChannel((err) => {

                expect(err).to.be.an.error(Exceptions.NoConnectionError);
                done();
            });
        });
    });

    describe('queue', () => {

        const queueName = 'test-queue-1';

        beforeEach((done) => {

            instance.closeConnection(done);
        });

        it('should throw NoChannelError when calling createQueue and connection does not pre-exist', (done) => {

            instance.createQueue(queueName, null, (err) => {

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

            instance.deleteQueue(queueName, null, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });

    describe('exchange', () => {

        const exchangeName = 'test-exchange-1';

        beforeEach((done) => {

            instance.closeConnection(done);
        });

        it('should throw NoChannelError when calling createExcahnge and connection does not pre-exist', (done) => {

            instance.createExchange(exchangeName, null, null, (err) => {

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

            instance.deleteExchange(exchangeName, null, (err) => {

                expect(err).to.be.an.error(Exceptions.NoChannelError);
                done();
            });
        });
    });
});
