'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const BunnyBus = require('../../../lib');
const { EventLogger } = require('../../../lib/loggers');
const Exceptions = require('../../../lib/exceptions');
const Assertions = require('../assertions');

const { describe, before, beforeEach, after, afterEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

let instance = undefined;

describe('BunnyBus', () => {
    describe('properties', () => {
        describe('logging', () => {
            const inputMessage = {
                prop1: 'message value 1',
                prop2: 'message value 2'
            };

            before(async () => {
                instance = new BunnyBus();
                instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            });

            describe('with default logger (Event Logger)', () => {
                it('should subscribe to `log.info` event when log.info() is called', async () => {
                    await Assertions.assertLogger(instance, 'info', BunnyBus.LOG_INFO_EVENT, inputMessage);
                });

                it('should subscribe to `log.error` event when log.error() is called', async () => {
                    await Assertions.assertLogger(instance, 'error', BunnyBus.LOG_ERROR_EVENT, inputMessage);
                });

                it('should subscribe to `log.warn` event when log.warn() is called', async () => {
                    await Assertions.assertLogger(instance, 'warn', BunnyBus.LOG_WARN_EVENT, inputMessage);
                });

                it('should subscribe to `log.fatal` event when log.fatal() is called', async () => {
                    await Assertions.assertLogger(instance, 'fatal', BunnyBus.LOG_FATAL_EVENT, inputMessage);
                });

                it('should subscribe to `log.debug` event when log.debug() is called', async () => {
                    await Assertions.assertLogger(instance, 'debug', BunnyBus.LOG_DEBUG_EVENT, inputMessage);
                });

                it('should subscribe to `log.info` event when log.info() is called with multiple arguments', async () => {
                    const arg1 = 'foo';
                    const arg2 = 'bar';

                    const promise = new Promise((resolve) => {
                        instance.once(BunnyBus.LOG_INFO_EVENT, (sentArg1, sentArg2) => {
                            expect(sentArg1).to.equal(arg1);
                            expect(sentArg2).to.equal(arg2);

                            resolve();
                        });
                    });

                    instance.logger.info(arg1, arg2);
                    await promise;
                });
            });

            describe('with custom logger (Fake Logger)', () => {
                after(async () => {
                    instance.logger = new EventLogger(instance);
                });

                it('should call custom info handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'info', inputMessage);
                });

                it('should call custom error handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'error', inputMessage);
                });

                it('should call custom warn handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'warn', inputMessage);
                });

                it('should call custom fatal handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'fatal', inputMessage);
                });

                it('should call custom debug handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'debug', inputMessage);
                });

                it('should call custom trace handler', async () => {
                    await Assertions.assertCustomLogger(instance, 'trace', inputMessage);
                });
            });

            describe('with incompatible logger', () => {
                it('should throw error when a logger with incompatible interface is set', async () => {
                    let result = null;

                    try {
                        instance.logger = { info: () => {} };
                    } catch (err) {
                        result = err;
                    }

                    expect(result).to.exist();
                    expect(result).to.be.an.error(Exceptions.IncompatibleLoggerError, 'logger is incompatible');
                });
            });
        });
    });
});
