'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const EventLogger = require('../../../lib/loggers').EventLogger;

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

const FakeLoggerFactory = (...levels) => {
    const logger = {};

    for (const level of levels) {
        logger[level] = () => {};
    }

    return logger;
};

describe('Helpers', () => {
    describe('validateLoggerContract', () => {
        it('should return true when validating EventLogger', async () => {
            await Assertions.assertValidateLoggerContract(new EventLogger(), true);
        });

        it('should return true when validating custom logger object', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error', 'fatal'), true);
        });

        it('should return false when validating custom logger missing debug', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('info', 'warn', 'error', 'fatal'), false);
        });

        it('should return false when validating custom logger missing info', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'warn', 'error', 'fatal'), false);
        });

        it('should return false when validating custom logger missing warn', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'error', 'fatal'), false);
        });

        it('should return false when validating custom logger missing error', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'fatal'), false);
        });

        it('should return false when validating custom logger missing fatal', async () => {
            await Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error'), false);
        });
    });
});
