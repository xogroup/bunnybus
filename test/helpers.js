'use strict';

const { expect } = require('@hapi/code');

const { describe, it } = (exports.lab = require('@hapi/lab').script());
const Assertions = require('./assertions');
const Helpers = require('../lib/helpers');
const EventLogger = require('../lib/eventLogger');
const Pkg = require('../package.json');

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
            const result = Helpers.createTransactionId();
            expect(result)
                .to.be.a.string()
                .and.to.have.length(40)
                .and.to.match(/^([\d\w]*)$/);
        });

        it('should create only unique tokens', async () => {
            const iterations = 1000;
            const tokens = await Promise.all(
                new Array(iterations)
                    .fill('')
                    .map(() => Helpers.createTransactionId())
            );
            const hash = {};
            for (let i = 0; i < iterations; ++i) {
                hash[tokens[i]] = (hash[tokens[i]] || 0) + 1;
                expect(hash[tokens[i]]).to.be.equal(1);
            }
        });
    });

    describe('getPackageData', () => {
        it('should return an identifier with {name, package} filled', () => {
            const result = Helpers.getPackageData();
            expect(result).to.exist();
            const semverMajor = Pkg.version.split('.', 1);
            const { name, version, semverMatch } = result;
            expect(name).to.be.equal(Pkg.name);
            expect(version).to.be.equal(Pkg.version);
            expect(semverMatch).to.be.equal(semverMajor + '.x.x');
        });
    });

    describe('cleanObject', () => {
        it('should clean properties that have no values at first level', () => {
            const obj = {
                a: 'value1',
                b: null,
                c: undefined,
                d: 'value2'
            };

            Helpers.cleanObject(obj);
            const cleanedKeys = Object.keys(obj);
            expect(cleanedKeys.find((key) => key === 'b')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'c')).to.be.undefined();
        });

        it('should clean properties that have no values at second level', () => {
            const obj = {
                a: {
                    a1: 'value1',
                    a2: null,
                    a3: undefined,
                    a4: 'value2'
                }
            };
            Helpers.cleanObject(obj);
            const cleanedKeys = Object.keys(obj.a);
            expect(cleanedKeys.find((key) => key === 'a2')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'a3')).to.be.undefined();
        });

        it('should not clean properties that are false', () => {
            const obj = {
                a: 'value1',
                b: true,
                c: false,
                d: undefined
            };
            Helpers.cleanObject(obj);
            const cleanedKeys = Object.keys(obj);
            expect(cleanedKeys.find((key) => key === 'd')).to.be.undefined();
        });
    });

    describe('convertToBuffer', () => {
        it('should convert a string to a Buffer', async () => {
            const data = 'hello';
            await Assertions.assertConvertToBuffer(data);
        });

        it('should convert an object to a Buffer', async () => {
            const data = {
                a: 'root1',
                b: 'root2',
                c: {
                    c1: 'sub1',
                    c2: 'sub2'
                }
            };
            await Assertions.assertConvertToBuffer(data);
        });

        it('should convert an array to a Buffer', async () => {
            const data = ['a', 'b', 1, 2];
            await Assertions.assertConvertToBuffer(data);
        });

        it('should not alter a Buffer input', async () => {
            const data = Buffer.from('hello');
            await Assertions.assertConvertToBuffer(data);
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
            const result = Helpers.isMajorCompatible(Pkg.version);
            expect(result).to.be.true();
        });
    });

    describe('reduceRouteKey', () => {
        const payloadHeaders = {
            properties: {
                headers: {
                    routeKey: 'a.b'
                }
            }
        };
        const payloadFields = {
            fields: {
                routingKey: 'a.c'
            }
        };
        const payload = {
            properties: payloadHeaders.properties,
            fields: payloadFields.fields
        };
        const message = {
            event: 'a.d'
        };
        const options = {
            routeKey: 'a.e'
        };

        it('should return from payload.properties.headers.routeKey when everything is supplied', () => {
            const result = Helpers.reduceRouteKey({
                payload,
                options,
                message
            });
            expect(result).to.be.equal(payload.properties.headers.routeKey);
        });

        it('should return from options.routeKey when payload contains fields.routingKey', () => {
            const result = Helpers.reduceRouteKey({
                payload: payloadFields,
                options,
                message
            });
            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is empty', () => {
            const result = Helpers.reduceRouteKey({ options, message });
            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from options.routeKey when payload is null', () => {
            const result = Helpers.reduceRouteKey({
                payload: payloadFields,
                options,
                message
            });
            expect(result).to.be.equal(options.routeKey);
        });

        it('should return from message.event when options is empty', () => {
            const result = Helpers.reduceRouteKey({
                payload: payloadFields,
                message
            });
            expect(result).to.be.equal(message.event);
        });

        it('should return from message.event when options is null', () => {
            const result = Helpers.reduceRouteKey({
                payload: payloadFields,
                message
            });
            expect(result).to.be.equal(message.event);
        });

        it('should return from payload.fields.routingKey when options is empty and message is empty', () => {
            const result = Helpers.reduceRouteKey({ payload: payloadFields });
            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return from payload.fields.routingKey when options is null and message is null', () => {
            const result = Helpers.reduceRouteKey({ payload: payloadFields });
            expect(result).to.be.equal(payloadFields.fields.routingKey);
        });

        it('should return undefined when all input is falsy', () => {
            const result = Helpers.reduceRouteKey();
            expect(result).to.be.undefined();
        });
    });

    describe('validateLoggerContract', () => {
        it('should return true when validating EventLogger', () => {
            Assertions.assertValidateLoggerContract(new EventLogger(), true);
        });

        it('should return true when validating custom logger object', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('debug', 'info', 'warn', 'error', 'fatal'),
                true
            );
        });

        it('should return false when validating custom logger missing debug', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('info', 'warn', 'error', 'fatal'),
                false
            );
        });

        it('should return false when validating custom logger missing info', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('debug', 'warn', 'error', 'fatal'),
                false
            );
        });

        it('should return false when validating custom logger missing warn', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('debug', 'info', 'error', 'fatal'),
                false
            );
        });

        it('should return false when validating custom logger missing error', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('debug', 'info', 'warn', 'fatal'),
                false
            );
        });

        it('should return false when validating custom logger missing fatal', () => {
            Assertions.assertValidateLoggerContract(
                FakeLoggerFactory('debug', 'info', 'warn', 'error'),
                false
            );
        });
    });

    describe('routeMatcher', () => {
        describe('when binding pattern is abc.xyz', () => {
            const pattern = 'abc.xyz';

            it('should match for abc.xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.xyz')).to.be.true();
            });

            it('should not match for xyz.abc', () => {
                expect(Helpers.routeMatcher(pattern, 'xyz.abc')).to.be.false();
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
                expect(
                    Helpers.routeMatcher(pattern, 'a.hello.world')
                ).to.be.false();
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
                expect(
                    Helpers.routeMatcher(pattern, 'world.hello.a')
                ).to.be.false();
            });
        });

        describe('when binding pattern is a.#', () => {
            const pattern = 'a.#';

            it('should match for a.hello', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello')).to.be.true();
            });

            it('should match for a.hello.world', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'a.hello.world')
                ).to.be.true();
            });

            it('should match for a.', () => {
                expect(Helpers.routeMatcher(pattern, 'a.')).to.be.true();
            });

            it('should not match for b.a.hello.world', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'b.a.hello.world')
                ).to.be.false();
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

            it('should match for a.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });
        });

        describe('when binding pattern is a.#.b', () => {
            const pattern = 'a.#.b';

            it('should match for a.hello.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.b')).to.be.true();
            });

            it('should match for a.hello.world.b', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'a.hello.world.b')
                ).to.be.true();
            });

            it('should not match for a.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });

            it('should match for a..b', () => {
                expect(Helpers.routeMatcher(pattern, 'a..b')).to.be.true();
            });

            it('should not match for hello.world.b', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'hello.world.b')
                ).to.be.false();
            });

            it('should match for a.hello.world', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'a.hello.world')
                ).to.be.false();
            });
        });

        describe('when binding pattern is abc.#.xyz', () => {
            const pattern = 'abc.#.xyz';

            it('should match for abc.hello.xyz', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'abc.hello.xyz')
                ).to.be.true();
            });

            it('should match for abc.hello.world.xyz', () => {
                expect(
                    Helpers.routeMatcher(pattern, 'abc.hello.world.xyz')
                ).to.be.true();
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
                'abc.#.xyz': () => {},
                'abc.*.hello.world': () => {},
                'abc.xyz': () => {}
            };
            const result = Helpers.handlerMatcher(handlers, 'world.hello');
            expect(result)
                .to.be.an.array()
                .and.to.have.length(0);
        });

        it('should match a single handler', () => {
            const handlers = {
                'hello.world': () => {},
                'world.hello': () => {}
            };
            const result = Helpers.handlerMatcher(handlers, 'world.hello');
            expect(result)
                .to.be.an.array()
                .and.to.have.length(1);
        });

        it('should match multiple handlers', () => {
            const handlers = {
                'abc.#.xyz': () => {},
                'abc.*.xyz': () => {},
                'abc.xyz': () => {}
            };
            const result = Helpers.handlerMatcher(handlers, 'abc.hello.xyz');
            expect(result)
                .to.be.an.array()
                .and.to.have.length(2);
        });
    });
});
