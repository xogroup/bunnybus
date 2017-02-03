'use strict';

const Code = require('code');
const Lab = require('lab');
const Async = require('async');
const Q = require('q');
const Bluebird = require('bluebird');
const Assertions = require('./assertions');
const Helpers = require('../lib/helpers');
const EventLogger = require('../lib/loggers').EventLogger;

const lab = exports.lab = Lab.script();
const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const FakeLoggerFactory = (...levels) => {

    const logger = {};

    for (const level of levels) {
        logger[level] = () => {};
    }

    return logger;
};

describe('helpers', () => {

    describe('createTransactionId', () => {

        it('should create an 40 character long alphanumeric token', (done) => {

            Helpers.createTransactionId((err, result) => {

                expect(err).to.be.null();
                expect(result).to.be.a.string();
                expect(result).to.have.length(40);
                expect(result).to.match(/^([\d\w]*)$/);
                done();
            });
        });

        it('should create only unique tokens', (done) => {

            const iterations = 10000;

            Async.times(
                iterations,
                (n, cb) => {

                    Helpers.createTransactionId(cb);
                },
                (err, tokens) => {

                    const hash = {};

                    for (let i = 0; i < iterations; ++i) {
                        hash[tokens[i]] = (hash[tokens[i]] || 0) + 1;
                        expect(hash[tokens[i]]).to.be.equal(1);
                    }

                    expect(err).to.be.null();
                    done();
                });
        });
    });

    describe('cleanObject', () => {

        it('should clean properties that have no values at first level', (done) => {

            const obj = {
                a : 'value1',
                b : null,
                c : undefined,
                d : 'value2'
            };

            Helpers.cleanObject(obj);

            const cleanedKeys = Object.keys(obj);

            expect(cleanedKeys.find((key) => key === 'b')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'c')).to.be.undefined();

            done();
        });

        it('should clean properties that have no values at second level', (done) => {

            const obj = {
                a : {
                    a1 : 'value1',
                    a2 : null,
                    a3 : undefined,
                    a4 : 'value2'
                }
            };

            Helpers.cleanObject(obj);

            const cleanedKeys = Object.keys(obj.a);

            expect(cleanedKeys.find((key) => key === 'a2')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'a3')).to.be.undefined();

            done();
        });
    });

    describe('convertToBuffer', () => {

        it('should convert a string to a Buffer', (done) => {

            const data = 'hello';

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should convert an object to a Buffer', (done) => {

            const data = {
                a : 'root1',
                b : 'root2',
                c : {
                    c1 : 'sub1',
                    c2 : 'sub2'
                }
            };

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should convert an array to a Buffer', (done) => {

            const data = ['a', 'b', 1, 2];

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should not alter a Buffer input', (done) => {

            const data = new Buffer('hello');

            Assertions.assertConvertToBuffer(data, done);
        });
    });

    describe('reduceCallback', () => {

        const callback = () => {};

        it('should return callback when given (callback)', (done) => {

            Assertions.assertReduceCallback(callback);
            done();
        });

        it('should return callback when given ({}, callback)', (done) => {

            Assertions.assertReduceCallback({}, callback);
            done();
        });

        it('should return callback when given (undefined, callback)', (done) => {

            Assertions.assertReduceCallback(undefined, callback);
            done();
        });

        it('should return callback when given (null, callback)', (done) => {

            Assertions.assertReduceCallback(null, callback);
            done();
        });

        it('should return callback when given ({}, null, callback)', (done) => {

            Assertions.assertReduceCallback({}, null, callback);
            done();
        });

        it('should return undefined when given ({})', (done) => {

            Assertions.assertUndefinedReduceCallback({});
            done();
        });

        it('should return undefined when given (undefined, undefined)', (done) => {

            Assertions.assertUndefinedReduceCallback(undefined, undefined);
            done();
        });

        it('should return undefined when given ()', (done) => {

            Assertions.assertUndefinedReduceCallback();
            done();
        });
    });

    describe('validateLoggerContract', () => {

        it('should return true when validating EventLogger', (done) => {

            Assertions.assertValidateLoggerContract(new EventLogger(), true, done);
        });

        it('should return true when validating custom logger object', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error', 'fatal'), true, done);
        });

        it('should return false when validating custom logger missing debug', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('info', 'warn', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing info', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'warn', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing warn', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing error', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing fatal', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error'), false, done);
        });
    });

    describe('toPromise', () => {

        const BunnyBus = require('../lib');
        const callbackFunction = (cb) => {

            return cb();
        };
        let instance = undefined;

        before((done) => {

            instance = new BunnyBus();
            instance.config = BunnyBus.DEFAULT_SERVER_CONFIGURATION;
            done();
        });

        after((done) => {

            instance.promise = Promise;
            done();
        });

        describe('default native Promise', () => {

            it('should promisify methods using the native implementation', (done) => {

                expect(instance.promise).to.equal(Promise);

                const task = Helpers.toPromise(instance, callbackFunction);

                expect(task).to.be.instanceof(Promise);
                expect(task.then).to.be.a.function();
                done();
            });

            it('should fallback to default native promise if unsupported implementation is used', (done) => {

                instance.promise = Q;

                expect(instance.promise).to.equal(Promise);

                const task = Helpers.toPromise(instance, callbackFunction);

                expect(task).to.be.instanceof(Promise);
                expect(task.then).to.be.a.function();
                done();
            });
        });

        describe('bluebird', () => {

            before((done) => {

                instance.promise = Bluebird;
                done();
            });

            it('should promisify methods using the Bluebird implementation', (done) => {

                expect(instance.promise).to.equal(Bluebird);

                const task = Helpers.toPromise(instance, callbackFunction);

                expect(task).to.be.instanceof(Bluebird);
                expect(task.then).to.be.a.function();
                done();
            });
        });
    });
});
