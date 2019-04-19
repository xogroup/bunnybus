'use strict';

const { before, describe, it } = (exports.lab = require('@hapi/lab').script());
const Assertions = require('./assertions');

const BunnyBus = require('../lib');

let instance;

describe('logging', () => {
    const inputMessage = {
        prop1: 'message value 1',
        prop2: 'message value 2'
    };

    before(() => {
        instance = new BunnyBus();
        instance.config = BunnyBus.Defaults.SERVER_CONFIGURATION;
    });

    describe('with default logger', () => {
        it('should subscribe to `log.info` event when log.info() is called', async () => {
            await Assertions.assertLogger(instance, 'info', inputMessage);
        });

        it('should subscribe to `log.error` event when log.error() is called', async () => {
            await Assertions.assertLogger(instance, 'error', inputMessage);
        });

        it('should subscribe to `log.warn` event when log.warn() is called', async () => {
            await Assertions.assertLogger(instance, 'warn', inputMessage);
        });

        it('should subscribe to `log.fatal` event when log.fatal() is called', async () => {
            await Assertions.assertLogger(instance, 'fatal', inputMessage);
        });

        it('should subscribe to `log.debug` event when log.debug() is called', async () => {
            await Assertions.assertLogger(instance, 'debug', inputMessage);
        });

        it('should subscribe to `log.trace` event when log.trace() is called', async () => {
            await Assertions.assertLogger(instance, 'trace', inputMessage);
        });
    });

    describe('with custom logger', () => {
        it('should call custom info handler', async () => {
            await Assertions.assertCustomLogger(instance, 'info', inputMessage);
        });

        it('should call custom error handler', async () => {
            await Assertions.assertCustomLogger(
                instance,
                'error',
                inputMessage
            );
        });

        it('should call custom warn handler', async () => {
            await Assertions.assertCustomLogger(instance, 'warn', inputMessage);
        });

        it('should call custom fatal handler', async () => {
            await Assertions.assertCustomLogger(
                instance,
                'fatal',
                inputMessage
            );
        });

        it('should call custom debug handler', async () => {
            await Assertions.assertCustomLogger(
                instance,
                'debug',
                inputMessage
            );
        });

        it('should call custom trace handler', async () => {
            await Assertions.assertCustomLogger(
                instance,
                'trace',
                inputMessage
            );
        });
    });
});
