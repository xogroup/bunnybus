
'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');

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

describe('positive integration tests - events', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('recovering', () =>  {

        before((done) => {

            instance._autoConnectChannel(done);
        });

        it('should be evented when connection is recovering', (done) => {

            instance.once(BunnyBus.RECOVERING_EVENT, done);

            instance.connection.emit('error');
        });
    });

    describe('recovered', () => {

        before((done) => {

            instance._autoConnectChannel(done);
        });

        it('should be evented when connection is recovering', (done) => {

            instance.once(BunnyBus.RECOVERED_EVENT, done);

            instance.connection.emit('error');
        });
    });

    describe('published', () => {

        const message = { event : 'published-event', name : 'bunnybus' };

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange)
            ], done);
        });

        it('should be evented when message is published', (done) => {

            instance.once(BunnyBus.PUBLISHED_EVENT, (sentMessage) => {

                expect(sentMessage).to.be.equal(message);
                done();
            });

            instance.publish(message, () => {});
        });
    });

    describe('subcribed', () => {

        const queueName = 'test-event-subscribed-queue-1';

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        afterEach((done) => {

            instance.channel.cancel(instance.subscriptions.get(queueName).consumerTag, (err) => {

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
                done(err);
            });
        });

        it('should be evented when queue is subscribed', (done) => {

            const handlers = {};
            handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};

            instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {

                expect(queue).to.be.equal(queueName);
                done();
            });

            instance.subscribe(queueName, handlers, () => {});
        });
    });

    describe('unsubscribed', () => {

        const queueName = 'test-event-unsubscribed-queue-1';

        beforeEach((done) => {

            const handlers = {};
            handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};

            instance.subscribe(queueName, handlers, done);
        });

        it('should be evented when queue is unsubscribed', (done) => {

            instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

                expect(queue).to.be.equal(queueName);
                done();
            });

            instance.unsubscribe(queueName, () => {});
        });
    });
});
