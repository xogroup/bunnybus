'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const before = lab.before;
const beforeEach = lab.beforeEach;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');
let instance = undefined;

describe('state management', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('subscriptions', () => {

        beforeEach((done) => {

            if(instance && instance._state && instance.subscriptions) {
                Object.keys(instance-_state.subscriptions, (key) => {

                    delete instance._state.subscriptions[key];
                });
            }

            done();
        });

        describe('_createSubscription', () => {

            const baseQueueName = 'subscription-createSubscription'

            it('should create one if it does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                const response = instance._createSubscription(queueName, consumerTag, handlers, options);
                const sut = instance._state.subscriptions[queueName];

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

                instance._createSubscription(queueName, consumerTag, handlers, options);
                const response = instance._createSubscription(queueName, consumerTag, handlers, options);

                expect(response).to.be.false();
                done();
            });
        });

        describe('_clearSubscription', () => {

            const baseQueueName = 'subscription-clearSubscription'

            it('should return true when subscription is cleared', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                const response = instance._clearSubscription(queueName);
                const sut = instance._state.subscriptions[queueName].hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.false();
                done();        
            });

            it('should return false when subscription exist but does not have a consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                delete instance._state.subscriptions[queueName].consumerTag;
                const response = instance._clearSubscription(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-3`;

                const response = instance._clearSubscription(queueName);

                expect(response).to.be.false();
                done();
            });
        });

        describe('_hasSubscription', () => {

            const baseQueueName = 'subscription-hasSubscription'

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance._hasSubscription(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription does exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                const response = instance._hasSubscription(queueName);

                expect(response).to.be.true();
                done();  
            });

            it('should return true when subscription does exist with removed consumerTag when using flag override', (done) => {

                const queueName = `${baseQueueName}-3`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                delete instance._state.subscriptions[queueName].consumerTag;
                const response = instance._hasSubscription(queueName, false);

                expect(response).to.be.true();
                done();  
            });
        });

        describe('_removeSubscription', () => {

            const baseQueueName = 'subscription-removeSubscription'

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance._removeSubscription(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                const response = instance._removeSubscription(queueName);

                expect(response).to.be.true();
                done();  
            });

            it('should return true when subscription exist with no consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance._createSubscription(queueName, consumerTag, handlers, options);
                delete instance._state.subscriptions[queueName].consumerTag;
                const response = instance._removeSubscription(queueName);

                expect(response).to.be.true();
                done();  
            });
        });
    });
});
