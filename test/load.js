'use strict';

const Async = require('async');
const Lab = require('lab');
const Bluebird = require('bluebird');

const lab = exports.lab = Lab.script();
const before = lab.before;
const after = lab.after;
const afterEach = lab.afterEach;
const describe = lab.describe;
const it = lab.it;

const BunnyBus = require('../lib');
let instance = undefined;

describe('integration load test', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('with callback interface', () => {

        const queueName = 'load-callback-queue-1';
        const errorQueueName = `${queueName}_error`;
        const message = { event : 'a.b', name : 'bunnybus' };
        const patterns = ['a.b'];
        const publishTarget = 2;

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

        afterEach((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.unsubscribe.bind(instance, queueName)
            ], done);
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange, null),
                instance.deleteQueue.bind(instance, queueName),
                instance.deleteQueue.bind(instance, errorQueueName)
            ], done);
        });

        it('should publish all messages within 2 seconds', (done) => {

            let count = 0;

            const resolver = (err) => {

                if (err) {
                    done(err);
                }
                else if (++count === publishTarget) {
                    done();
                }
            };

            for (let i = 0; i < publishTarget; ++i) {
                instance.publish(message, null, resolver);
            }
        });

        it('should consume all messages within 2 seconds', (done) => {

            let count = 0;

            instance.subscribe(
                queueName,
                {
                    'a.b' : (msg, ack) => {

                        ack(null, () => {

                            if (++count === publishTarget) {
                                done();
                            }
                        });
                    }
                },
                null,
                () => {});
        });
    });

    describe('with promises interface', () => {

        const queueName = 'load-promise-queue-1';
        const errorQueueName = `${queueName}_error`;
        const message = { event : 'a.promise', name : 'bunnybus' };
        const patterns = ['a.promise'];
        const publishTarget = 2;

        before(() => {

            return instance._autoConnectChannel()
                .then(instance.createExchange.bind(instance, instance.config.globalExchange, 'topic', null))
                .then(instance.createQueue.bind(instance, queueName))
                .then(() => {

                    const promises = patterns.map((pattern) => {

                        return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
                    });

                    return Promise.all(promises);
                });
        });

        afterEach(() => {

            return instance._autoConnectChannel()
                .then(instance.unsubscribe.bind(instance, queueName));
        });

        after(() => {

            return instance._autoConnectChannel()
                .then(instance.deleteExchange.bind(instance, instance.config.globalExchange, null))
                .then(instance.deleteQueue.bind(instance, queueName))
                .then(instance.deleteQueue.bind(instance, errorQueueName));
        });

        it('should publish all messages within 2 seconds', () => {

            const promises = [];

            for (let i = 0; i < publishTarget; ++i) {
                promises.push(instance.publish(message));
            }

            return Promise.all(promises);
        });

        it('should consume all messages within 2 seconds', (done) => {

            let count = 0;

            instance.subscribe(
                queueName,
                {
                    'a.promise' : (msg, ack) => {

                        return ack()
                            .then(() => {

                                if (++count === publishTarget) {
                                    done();
                                }
                            });
                    }
                });
        });
    });

    describe('with third-party promise interface', () => {

        const queueName = 'load-promise-queue-2';
        const errorQueueName = `${queueName}_error`;
        const message = { event : 'b.promise', name : 'bunnybus' };
        const patterns = ['b.promise'];
        const publishTarget = 2000;

        before(() => {

            instance.promise = Bluebird;

            return instance._autoConnectChannel()
                .then(instance.createExchange.bind(instance, instance.config.globalExchange, 'topic', null))
                .then(instance.createQueue.bind(instance, queueName))
                .then(() => {

                    const promises = patterns.map((pattern) => {

                        return instance.channel.bindQueue(queueName, instance.config.globalExchange, pattern);
                    });

                    return Promise.all(promises);
                });
        });

        afterEach(() => {

            return instance._autoConnectChannel()
                .then(instance.unsubscribe.bind(instance, queueName));
        });

        after(() => {

            return instance._autoConnectChannel()
                .then(instance.deleteExchange.bind(instance, instance.config.globalExchange, null))
                .then(instance.deleteQueue.bind(instance, queueName))
                .then(instance.deleteQueue.bind(instance, errorQueueName))
                .then(() => {
                    instance.promise = Promise;
                });
        });

        it('should publish all messages within 2 seconds', () => {

            const promises = [];

            for (let i = 0; i < publishTarget; ++i) {
                promises.push(instance.publish(message));
            }

            return Promise.all(promises);
        });

        it('should consume all messages within 2 seconds', (done) => {

            let count = 0;

            instance.subscribe(
                queueName,
                {
                    'b.promise' : (msg, ack) => {

                        return ack()
                            .then(() => {

                                if (++count === publishTarget) {
                                    done();
                                }
                            });
                    }
                });
        });
    });
});
