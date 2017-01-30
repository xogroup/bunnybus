'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');
const Exceptions = require('../lib/exceptions');
const Assertions = require('./assertions');

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

describe('integration load test', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe.only('with callback interface', (done) => {

        const queueName = 'load-callback-queue-1';
        const errorQueueName = `${queueName}_error`;
        const message = { event : 'a.b', name : 'bunnybus' };
        const patterns = ['a.b'];
        const publishTarget = 1000;

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
                else if(++count === publishTarget) {
                    done();
                }
            };

            for(let i=0; i<publishTarget; ++i) {
                instance.publish(message, null, resolver);
            }
        });

        it('should consume all messages within 2 seconds', (done) => {

            let count = 0;

            instance.subscribe(
                queueName, 
                {
                    'a.b' : (message, ack, reject, requeue) => {

                        ack(null, () => {

                            if (++count === publishTarget) {
                                console.log('calling done from consume load test');
                                done();
                            }
                        });
                    }
                }, 
                null,
                () => {});
        });
    });

    describe('with promises interface', (done) => {

    });
})