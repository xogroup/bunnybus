'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const before = lab.before;
const beforeEach = lab.beforeEach;
const it = lab.it;
const expect = Code.expect;

const SubscriptionManager = require('../lib/states/subscriptionManager');
let instance = undefined;

describe('state management', () => {

    describe('subscriptions', () => {

        before((done) => {

            instance = new SubscriptionManager();
            done();
        });

        beforeEach((done) => {

            if (instance && instance._subscriptions) {
                Object.keys(instance._subscriptions, (key) => {

                    delete instance._subscriptions[key];
                });
            }

            done();
        });

        describe('create', () => {

            const baseQueueName = 'subscription-createSubscription';

            it('should create one if it does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                const response = instance.create(queueName, consumerTag, handlers, options);
                const sut = instance._subscriptions[queueName];

                expect(response).to.be.true();
                expect(sut).to.exist();
                expect(sut.consumerTag).to.equal(consumerTag);
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
                done();
            });

            it('should not create one if it does exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                const response = instance.create(queueName, consumerTag, handlers, options);

                expect(response).to.be.false();
                done();
            });
        });

        describe('get', () => {

            const baseQueueName = 'subscription-getSubscription';

            it('should return a subscription when it exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                const sut = instance.get(queueName);

                expect(sut).to.exist();
                expect(sut.consumerTag).to.equal(consumerTag);
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
                done();
            });

            it('should return undefined when it does not exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const sut = instance.get(queueName);

                expect(sut).to.be.undefined();
                done();
            });
        });

        describe('clear', () => {

            const baseQueueName = 'subscription-clearSubscription';

            it('should return true when subscription is cleared', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                const response = instance.clear(queueName);
                const sut = instance._subscriptions[queueName].hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.false();
                done();
            });

            it('should return false when subscription exist but does not have a consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                delete instance._subscriptions[queueName].consumerTag;
                const response = instance.clear(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-3`;

                const response = instance.clear(queueName);

                expect(response).to.be.false();
                done();
            });
        });

        describe('contains', () => {

            const baseQueueName = 'subscription-contains';

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance.contains(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription does exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                const response = instance.contains(queueName);

                expect(response).to.be.true();
                done();
            });

            it('should return true when subscription does exist with removed consumerTag when using flag override', (done) => {

                const queueName = `${baseQueueName}-3`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                delete instance._subscriptions[queueName].consumerTag;
                const response = instance.contains(queueName, false);

                expect(response).to.be.true();
                done();
            });
        });

        describe('remove', () => {

            const baseQueueName = 'subscription-removeSubscription';

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance.remove(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                const response = instance.remove(queueName);

                expect(response).to.be.true();
                done();
            });

            it('should return true when subscription exist with no consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, consumerTag, handlers, options);
                delete instance._subscriptions[queueName].consumerTag;
                const response = instance.remove(queueName);

                expect(response).to.be.true();
                done();
            });
        });
    });
});
