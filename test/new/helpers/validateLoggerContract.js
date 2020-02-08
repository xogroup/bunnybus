'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const { Promisify } = require('../../promisify');
const EventLogger = require('../../../lib/loggers').EventLogger;

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
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

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(new EventLogger(), true, done);
            });
        });

        it('should return true when validating custom logger object', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error', 'fatal'), true, done);
            });
        });

        it('should return false when validating custom logger missing debug', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('info', 'warn', 'error', 'fatal'), false, done);
            });
        });

        it('should return false when validating custom logger missing info', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'warn', 'error', 'fatal'), false, done);
            });
        });

        it('should return false when validating custom logger missing warn', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'error', 'fatal'), false, done);
            });
        });

        it('should return false when validating custom logger missing error', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'fatal'), false, done);
            });
        });

        it('should return false when validating custom logger missing fatal', async () => {

            return Promisify((done) => {

                Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error'), false, done);
            });
        });
    });
});
