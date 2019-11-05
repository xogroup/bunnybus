'use strict';

const Lab = require('lab');
const { PromisifyWrap } = require('../promisify');

const lab = exports.lab = Lab.script();
const before = lab.before;
const describe = lab.describe;
const it = lab.it;
const Assertions = require('./assertions');

const BunnyBus = require('../../lib');

let instance = undefined;

describe('logging', () => {

    const inputMessage = {
        prop1 : 'message value 1',
        prop2 : 'message value 2'
    };

    before(async () => {

        instance = new BunnyBus();
        instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
    });

    describe('with default logger', () => {

        it('should subscribe to `log.info` event when log.info() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'info', inputMessage, done);
            });
        });

        it('should subscribe to `log.error` event when log.error() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'error', inputMessage, done);
            });
        });

        it('should subscribe to `log.warn` event when log.warn() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'warn', inputMessage, done);
            });
        });

        it('should subscribe to `log.fatal` event when log.fatal() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'fatal', inputMessage, done);
            });
        });

        it('should subscribe to `log.debug` event when log.debug() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'debug', inputMessage, done);
            });
        });

        it('should subscribe to `log.trace` event when log.trace() is called', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertLogger(instance, 'trace', inputMessage, done);
            });
        });
    });

    describe('with custom logger', () => {

        it('should call custom info handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'info', inputMessage, done);
            });
        });

        it('should call custom error handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'error', inputMessage, done);
            });
        });

        it('should call custom warn handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'warn', inputMessage, done);
            });
        });

        it('should call custom fatal handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'fatal', inputMessage, done);
            });
        });

        it('should call custom debug handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'debug', inputMessage, done);
            });
        });

        it('should call custom trace handler', async () => {

            return PromisifyWrap((done) => {

                Assertions.assertCustomLogger(instance, 'trace', inputMessage, done);
            });
        });
    });
});
