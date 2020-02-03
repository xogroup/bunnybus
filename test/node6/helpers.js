'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Async = require('async');
const Q = require('q');
const Bluebird = require('bluebird');
const Assertions = require('./assertions');
const Helpers = require('../../lib/helpers');
const { Promisify } = require('../promisify');
const EventLogger = require('../../lib/loggers').EventLogger;

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
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

        it('should create an 40 character long alphanumeric token', () => {

            Helpers.createTransactionId((err, result) => {

                expect(err).to.not.exist();
                expect(result).to.be.a.string();
                expect(result).to.have.length(40);
                expect(result).to.match(/^([\d\w]*)$/);
            });
        });

        it('should create only unique tokens', async () => {

            return Promisify((done) => {

                const iterations = 1000;

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

                        expect(err).to.not.exist();
                        done();
                    });
            });
        });
    });

    describe('getPackageData', () => {

        it('should return an identifier with {name, package} filled', () => {

            const result = Helpers.getPackageData();

            const semverMajor = require('../../package.json').version.split('.', 1);

            expect(result).to.exist();
            expect(result.name).to.be.equal(require('../../package.json').name);
            expect(result.version).to.be.equal(require('../../package.json').version);
            expect(result.semverMatch).to.be.equal(semverMajor + '.x.x');
        });
    });

    describe('cleanObject', () => {

        it('should clean properties that have no values at first level', () => {

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
        });

        it('should clean properties that have no values at second level', () => {

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
        });

        it('should not clean properties that are false', () => {

            const obj = {
                a : 'value1',
                b : true,
                c : false,
                d : undefined
            };

            Helpers.cleanObject(obj);

            const cleanedKeys = Object.keys(obj);

            expect(cleanedKeys.find((key) => key === 'd')).to.be.undefined();
        });
    });

    describe('convertToBuffer', () => {

        it('should convert a string to a Buffer', async () => {

            return Promisify((done) => {

                const data = 'hello';

                Assertions.assertConvertToBuffer(data, done);
            });
        });

        it('should convert an object to a Buffer', async () => {

            return Promisify((done) => {

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
        });

        it('should convert an array to a Buffer', async () => {

            return Promisify((done) => {

                const data = ['a', 'b', 1, 2];

                Assertions.assertConvertToBuffer(data, done);
            });
        });

        it('should not alter a Buffer input', async () => {

            return Promisify((done) => {

                const data = Buffer.from('hello');

                Assertions.assertConvertToBuffer(data, done);
            });
        });
    });

    describe('isMajorCompatible', () => {

        it('should return true when major matches', () => {

            const result = Helpers.isMajorCompatible('1.2.3', '1.x.x');

            expect(result).to.be.true();
        });

        it('should return false when major does not match', () => {

            const result = Helpers.isMajorCompatible('2.1.3', '1.x.x');

            expect(result).to.be.false();
        });

        it('should return true when using package defaults', () => {

            const result = Helpers.isMajorCompatible(require('../../package.json').version);

            expect(result).to.be.true();
        });
    });

    describe('reduceRouteKey', () => {

        const payloadHeaders = {
            properties : {
                headers : {
                    routeKey : 'a.b'
                }
            }
        };

        const payloadFields = {
            fields : {
                routingKey : 'a.c'
            }
        };

        const payload = {
            properties : payloadHeaders.properties,
            fieldds : payloadFields.fields
        };

        const message = {
            event : 'a.d'
        };

        const options = {
            routeKey : 'a.e'
        };

        it('should return from payload.properties.headers.routeKey when everything is supplied', () => {

            const result = Helpers.reduceRouteKey(payload, options, message);

            expect(result).to.be.equal(payload.properties.headers.routeKey);
        });

        it('should return from options.routeKey when payload contains fields.routingKey', () => {

            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is empty', () => {

            const result = Helpers.reduceRouteKey({}, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is null', () => {

            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from message.event when options is empty', () => {

            const result = Helpers.reduceRouteKey(payloadFields, {}, message);

            expect(result).to.be.equal(message.event);
        });

        it('should return from message.event when options is null', () => {

            const result = Helpers.reduceRouteKey(payloadFields, null, message);

            expect(result).to.be.equal(message.event);
        });

        it('should return from payload.fields.routingKey when options is empty and message is empty', () => {

            const result = Helpers.reduceRouteKey(payloadFields, {}, {});

            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return from payload.fields.routingKey when options is null and message is null', () => {

            const result = Helpers.reduceRouteKey(payloadFields, null, null);

            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return undefined when all input is falsy', () => {

            const result = Helpers.reduceRouteKey(null, null, null);

            expect(result).to.be.undefined();
        });
    });

    describe('reduceCallback', () => {

        const callback = () => {};

        it('should return callback when given (callback)', () => {

            Assertions.assertReduceCallback(callback);
        });

        it('should return callback when given ({}, callback)', () => {

            Assertions.assertReduceCallback({}, callback);
        });

        it('should return callback when given (undefined, callback)', () => {

            Assertions.assertReduceCallback(undefined, callback);
        });

        it('should return callback when given (null, callback)', () => {

            Assertions.assertReduceCallback(null, callback);
        });

        it('should return callback when given ({}, null, callback)', () => {

            Assertions.assertReduceCallback({}, null, callback);
        });

        it('should return undefined when given ({})', () => {

            Assertions.assertUndefinedReduceCallback({});
        });

        it('should return undefined when given (undefined, undefined)', () => {

            Assertions.assertUndefinedReduceCallback(undefined, undefined);
        });

        it('should return undefined when given ()', () => {

            Assertions.assertUndefinedReduceCallback();
        });
    });

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

    describe('validatePromiseContract', () => {

        it('should return true for native Promise', () => {

            expect(Helpers.validatePromiseContract(Promise)).to.be.true();
        });

        it('should return true for Bluebird', () => {

            expect(Helpers.validatePromiseContract(Bluebird)).to.be.true();
        });

        it('should return false for q', () => {

            expect(Helpers.validatePromiseContract(Q)).to.be.false();
        });

        it('should return false for non-promise constructor', () => {

            class BadPromise {}

            expect(Helpers.validatePromiseContract(BadPromise)).to.be.false();
        });
    });

    describe('toPromise', () => {

        const callback = () => {};

        describe('ES6 Promise', () => {

            it('should promisify methods using the native implementation', () => {

                //expect(instance.promise).to.be.equal(Promise);

                const task = Helpers.toPromise(Promise, callback);

                expect(task).to.be.instanceof(Promise);
                expect(task.then).to.be.a.function();
            });
        });

        describe('Bluebird Promise', () => {

            it('should promisify methods using the Bluebird implementation', () => {

                const task = Helpers.toPromise(Bluebird, callback);

                expect(task).to.be.instanceof(Bluebird);
                expect(task.then).to.be.a.function();
            });
        });
    });

    describe('routeMatcher', () => {

        describe('when binding pattern is abc.xyz', () =>  {

            const pattern = 'abc.xyz';

            it('should match for abc.xyz', () => {

                expect(Helpers.routeMatcher(pattern, 'abc.xyz')).to.be.true();
            });

            it('should not match for xyz.abc', () => {

                expect(Helpers.routeMatcher(pattern, 'xyz.abc')).to.be.false();
            });
        });

        describe('when binding pattern is abc.xyz-rpq_mno', () => {

            const pattern = 'abc.xyz-rpq_mno';

            it('should match for abc.xyz-rpq_mno', () => {

                expect(Helpers.routeMatcher(pattern, 'abc.xyz-rpq_mno')).to.be.true();
            });

            it('should not match for xyz.abc-rpq_mno', () => {

                expect(Helpers.routeMatcher(pattern, 'xyz.abc-rpq_mno')).to.be.false();
            });
        });

        describe('when binding pattern is a.*', () => {

            const pattern = 'a.*';

            it('should match for a.hello', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello')).to.be.true();
            });

            it('should match for a.hello', () => {

                expect(Helpers.routeMatcher(pattern, 'a.')).to.be.true();
            });

            it('should not match for a.hello.world', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is *.a', () => {

            const pattern = '*.a';

            it('should match for hello.a', () => {

                expect(Helpers.routeMatcher(pattern, 'hello.a')).to.be.true();
            });

            it('should match for .a', () => {

                expect(Helpers.routeMatcher(pattern, '.a')).to.be.true();
            });

            it('should not match for world.hello.a', () => {

                expect(Helpers.routeMatcher(pattern, 'world.hello.a')).to.be.false();
            });
        });

        describe('when binding pattern is a.#', () => {

            const pattern = 'a.#';

            it('should match for a.hello', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello')).to.be.true();
            });

            it('should match for a.hello.world', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.true();
            });

            it('should match for a.', () => {

                expect(Helpers.routeMatcher(pattern, 'a.')).to.be.true();
            });

            it('should not match for b.a.hello.world', () => {

                expect(Helpers.routeMatcher(pattern, 'b.a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is a.*.b', () => {

            const pattern = 'a.*.b';

            it('should match for a.c.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.c.b')).to.be.true();
            });

            it('should match for a..b', () => {

                expect(Helpers.routeMatcher(pattern, 'a..b')).to.be.true();
            });

            it('should not match for a.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });

            it('should not match for a.n.d.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.n.d.b')).to.be.false();
            });
        });

        describe('when binding pattern is a.#.b', () => {

            const pattern = 'a.#.b';

            it('should match for a.hello.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.b')).to.be.true();
            });

            it('should match for a.hello.world.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.world.b')).to.be.true();
            });

            it('should not match for a.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });

            it('should match for a..b', () => {

                expect(Helpers.routeMatcher(pattern, 'a..b')).to.be.true();
            });

            it('should not match for hello.world.b', () => {

                expect(Helpers.routeMatcher(pattern, 'hello.world.b')).to.be.false();
            });

            it('should not match for a.hello.world', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is a.#.b-_c', () => {

            const pattern = 'a.#.b-_c';

            it('should match for a.hello.world.b-_c', () => {

                expect(Helpers.routeMatcher(pattern, 'a.hello.world.b-_c')).to.be.true();
            });

            it('should match for a.h-e-l-l-o.w-o-r-l-d.b-_c', () => {

                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should match for a.h_e_l_l_o.w_o_r_l_d.b-_c', () => {

                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should match for a.h-e_l-l_o.w_o-r_l-d.b-_c', () => {

                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should not match for b.h-e_l-l_o.w_o-r_l-d.b-_c', () => {

                expect(Helpers.routeMatcher(pattern, 'b.h-e_l-l_o.w_o-r_l-d.b-_c')).to.be.false();
            });

            it('should not match for a.h-e_l-l_o.w_o-r_l-d.b', () => {

                expect(Helpers.routeMatcher(pattern, 'a.h-e_l-l_o.w_o-r_l-d.b')).to.be.false();
            });
        });

        describe('when binding pattern is abc.#.xyz', () => {

            const pattern = 'abc.#.xyz';

            it('should match for abc.hello.xyz', () => {

                expect(Helpers.routeMatcher(pattern, 'abc.hello.xyz')).to.be.true();
            });

            it('should match for abc.hello.world.xyz', () => {

                expect(Helpers.routeMatcher(pattern, 'abc.hello.world.xyz')).to.be.true();
            });

            it('should match for abc..xyz', () => {

                expect(Helpers.routeMatcher(pattern, 'abc..xyz')).to.be.true();
            });

            it('should not match for abc.xyz', () => {

                expect(Helpers.routeMatcher(pattern, 'abc.xyz')).to.be.false();
            });
        });

        describe('when binding pattern is .#.', () => {

            const pattern = '.#.';

            it('should match for .a.', () => {

                expect(Helpers.routeMatcher(pattern, '.a.')).to.be.true();
            });

            it('should match for .#.', () => {

                expect(Helpers.routeMatcher(pattern, '.#.')).to.be.true();
            });

            it('should match for ..', () => {

                expect(Helpers.routeMatcher(pattern, '..')).to.be.true();
            });

            it('should match for ....', () => {

                expect(Helpers.routeMatcher(pattern, '....')).to.be.true();
            });
        });

        describe('when binding pattern is .*.', () => {

            const pattern = '.#.';

            it('should match for .a.', () => {

                expect(Helpers.routeMatcher(pattern, '.a.')).to.be.true();
            });

            it('should match for .#.', () => {

                expect(Helpers.routeMatcher(pattern, '.#.')).to.be.true();
            });

            it('should match for .#.', () => {

                expect(Helpers.routeMatcher(pattern, '..')).to.be.true();
            });
        });
    });

    describe('handlerMatcher', () => {

        it('should not match any handler', () => {

            const handlers = {
                'abc.#.xyz' : () => {},
                'abc.*.hello.world': () => {},
                'abc.xyz' : () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'world.hello');

            expect(result).to.be.an.array();
            expect(result).to.have.length(0);
        });

        it('should match a single handler', () => {

            const handlers = {
                'hello.world' : () => {},
                'world.hello' : () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'world.hello');

            expect(result).to.be.an.array();
            expect(result).to.have.length(1);
        });

        it('should match multiple handlers', () => {

            const handlers = {
                'abc.#.xyz' : () => {},
                'abc.*.xyz' : () => {},
                'abc.xyz' : () => {}
            };

            const result = Helpers.handlerMatcher(handlers, 'abc.hello.xyz');

            expect(result).to.be.an.array();
            expect(result).to.have.length(2);
        });
    });

    describe('isString', () => {

        it('should be true with string literal', () => {

            const result = Helpers.isString('foo');

            expect(result).to.be.true();
        });

        it('should be true with string object', () => {

            // eslint-disable-next-line no-new-wrappers
            const result = Helpers.isString(new String('foo'));

            expect(result).to.be.true();
        });

        it('should be false when undefined', () => {

            const result = Helpers.isString();

            expect(result).to.be.false();
        });

        it('should be false for a simple object', () => {

            const result = Helpers.isString({});

            expect(result).to.be.false();
        });

        it('should be false for a complex object', () => {

            const result = Helpers.isString(new Date());

            expect(result).to.be.false();
        });

        it('should be false for a function', () => {

            const result = Helpers.isString(() => {});

            expect(result).to.be.false();
        });
    });

    describe('retryAsync', () => {

        let i = undefined;

        beforeEach(() => {

            i = 0;
        });

        it('should run once', async () => {

            const result = await Helpers.retryAsync(
                async () => {

                    return ++i;
                }
            );

            expect(result).to.equal(1);
        });

        it('should run twice', async () => {

            const result = await Helpers.retryAsync(
                async () => {

                    if (++i < 2) {
                        throw new Error();
                    }

                    return i;
                }
            );

            expect(result).to.equal(2);
        });

        it('should take longer to run when interval is set with larger wait duration', async () => {

            const startTime = new Date();
            let endTimeX; let endTimeY;
            let x; let y = 0;

            await Promise.all([
                Helpers.retryAsync(
                    async () => {

                        if (++x < 2) {
                            throw new Error();
                        }

                        endTimeX = new Date();
                    },
                    100
                ),
                Helpers.retryAsync(
                    async () => {

                        if (++y < 2) {
                            throw new Error();
                        }

                        endTimeY = new Date();
                    },
                    1000
                )
            ]);

            const diffTimeX = endTimeX.getTime() - startTime.getTime();
            const diffTimeY = endTimeY.getTime() - startTime.getTime();

            expect(diffTimeX).to.be.below(diffTimeY);
        });

        it('should run with interval supplied as a function', async () => {

            let dynamicIntervalResult = 0;

            const result = await Helpers.retryAsync(
                async () => {

                    if (++i < 3) {
                        throw new Error();
                    }

                    return i;
                },
                (retryCount) => {

                    dynamicIntervalResult = 50 * Math.pow(2, retryCount);
                    return dynamicIntervalResult;
                }
            );

            expect(result).to.equal(3);
            expect(dynamicIntervalResult).to.equal(200);
        });

        it('should error when attempt limits are reached', async () => {

            let result = null;

            try {
                await Helpers.retryAsync(
                    async () => {

                        ++i;
                        throw new Error();
                    },
                    100,
                    2
                );
            }
            catch (err) {
                result = err;
            }

            expect(i).to.equal(2);
            expect(result).to.be.an.error(Error, 'Exceeded maximum attempts of retries');
        });

        it('should error when error filter trips', async () => {

            let result = null;

            try {
                await Helpers.retryAsync(
                    async () => {

                        throw new Error();
                    },
                    100,
                    2,
                    () => {

                        return false;
                    }
                );
            }
            catch (err) {
                result = err;
            }

            expect(result).to.be.an.error(Error, 'Error Filter tripped');
        });
    });
});
