'use strict';

const Async = require('async');
const Code = require('code');
const Lab = require('lab');
const Promisify = require('../promisify');

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

describe('positive integration tests - events', () => {

    before(() => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('recovering', () =>  {

        beforeEach(async () => {

            return Promisify(instance._autoConnectChannel);
        });

        it('should be evented when connection was closed and is recovering', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.RECOVERING_EVENT, done);

                instance.connection.emit('close');
            });
        });

        it('should be evented when channel was closed and is recovering', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.RECOVERING_EVENT, done);

                instance.channel.emit('close');
            });
        });
    });

    describe('recovered', () => {

        before(async () => {

            return Promisify(instance._autoConnectChannel);
        });

        it('should be evented when connection was closed and is recovering', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.RECOVERED_EVENT, done);

                instance.connection.emit('close');
            });
        });

        it('should be evented when channel was closed and is recovering', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.RECOVERED_EVENT, done);

                instance.channel.emit('close');
            });
        });
    });

    describe('published', () => {

        const message = { event : 'published-event', name : 'bunnybus' };

        after(async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                Async.waterfall([
                    instance._autoConnectChannel,
                    instance.deleteExchange.bind(instance, instance.config.globalExchange)
                ], done);
            });
        });

        it('should be evented when message is published', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.PUBLISHED_EVENT, (sentMessage) => {

                    expect(sentMessage).to.be.equal(message);
                    done();
                });

                instance.publish(message, () => {});
            });
        });
    });

    describe('subcribed', () => {

        const queueName = 'test-event-subscribed-queue-1';

        after(async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                Async.waterfall([
                    instance._autoConnectChannel,
                    instance.deleteExchange.bind(instance, instance.config.globalExchange),
                    instance.deleteQueue.bind(instance, queueName)
                ], done);
            });
        });

        afterEach(async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.channel.cancel(instance.subscriptions.get(queueName).consumerTag, (err) => {

                    instance.subscriptions._subscriptions.clear();
                    instance.subscriptions._blockQueues.clear();
                    done(err);
                });
            });
        });

        it('should be evented when queue is subscribed', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                const handlers = {};
                handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};

                instance.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {

                    expect(queue).to.be.equal(queueName);
                    done();
                });

                instance.subscribe(queueName, handlers, () => {});
            });
        });
    });

    describe('unsubscribed', () => {

        const queueName = 'test-event-unsubscribed-queue-1';

        beforeEach(async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                const handlers = {};
                handlers['subscribed-event'] = (consumedMessage, ack, reject, requeue) => {};

                instance.subscribe(queueName, handlers, done);
            });
        });

        it('should be evented when queue is unsubscribed', async () => {

            return new Promise((res, rej) => {

                const done = (err) => {

                    return err
                        ? rej(err)
                        : res();
                };

                instance.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

                    expect(queue).to.be.equal(queueName);
                    done();
                });

                instance.unsubscribe(queueName, () => {});
            });
        });
    });
});
