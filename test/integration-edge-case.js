'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const before = lab.before;
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const BunnyBus = require('../lib');
let instance = undefined;

describe('positive integration tests - Callback api', () => {

    before((done) => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
        done();
    });

    describe('edge cases', () => {

        beforeEach((done) => {

            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            instance._closeConnection(done);
        });

        it('should pass when parallel calls to publish happens when connection starts off closed', (done) => {

            const message = { event : 'ee', name : 'bunnybus' };

            Async.parallel([
                instance.publish.bind(instance, message),
                instance.publish.bind(instance, message),
                instance.publish.bind(instance, message)
            ],
            (err, result) => {

                expect(err).to.be.null();
                done();
            });
        });

        it('should pass when send pushes a message to a subscribed queue', (done) => {

            const message = { event : 'ea', name : 'bunnybus' };
            const queueName = 'edge-case-get-to-subscribe';
            let counter = 0;
            const handlers = {
                ea : (subscribedMessaged, ack) => {

                    expect(subscribedMessaged).to.be.equal(message);
                    ack(resolve);
                }
            };
            const resolve = () => {

                if (++counter === 2) {
                    done();
                }
            };

            Async.waterfall([
                (cb) => instance._autoConnectChannel(cb),
                (cb) => instance.createQueue(queueName, cb),
                (result, cb) => instance.send(message, queueName, cb),
                (cb) => instance.subscribe(queueName, handlers, cb),
                (cb) => instance.deleteQueue(queueName, cb)
            ], resolve);
        });

        it('should pass when server host configuration value is not valid', (done) => {

            const message = { event : 'eb', name : 'bunnybus' };
            instance.config = { server : 'fake' };

            instance
                .publish(message)
                .catch(() => {

                    // re-up with default configs
                    instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;

                    return instance
                        .publish(message)
                        .then(done);
                });
        });
    });
});
