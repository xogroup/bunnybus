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

describe('positive integration tests - event handlers', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('blocked', () => {

        const queueName = 'test-event-handlers-blocked-queue-1';

        beforeEach((done) => {

            const handlers = {};
            handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};
            instance.subscribe(queueName, handlers, done);
        });

        afterEach((done) => {

            instance.subscriptions._subscriptions.clear();
            instance.subscriptions._blockQueues.clear();
            done();
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should cause `unsubscribed()` to be called', (done) => {

            instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

                expect(queue).to.equal(queueName);
                done();
            });

            instance.subscriptions.block(queueName);
        });
    });

    describe('unblocked', () => {

        const queueName = 'test-event-handlers-unblocked-queue-1';

        beforeEach((done) => {

            const handlers = {};
            handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};
            instance.subscriptions.create(queueName, undefined, handlers);
            instance.subscriptions._blockQueues.add(queueName);
            done();
        });

        afterEach((done) => {

            instance.channel.cancel(instance.subscriptions.get(queueName).consumerTag, (err) => {

                instance.subscriptions._subscriptions.clear();
                instance.subscriptions._blockQueues.clear();
                done(err);
            });
        });

        after((done) => {

            Async.waterfall([
                instance._autoConnectChannel,
                instance.deleteExchange.bind(instance, instance.config.globalExchange),
                instance.deleteQueue.bind(instance, queueName)
            ], done);
        });

        it('should cause `subscribed()` to be called', (done) => {

            instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {

                expect(queue).to.equal(queueName);
                done();
            });

            instance.subscriptions.unblock(queueName);
        });
    });
});
