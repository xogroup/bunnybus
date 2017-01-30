'use strict';

const Code = require('code');
const Lab = require('lab');
const Async = require('async');
const Assertions = require('./assertions');
const Helpers = require('../lib/helpers');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

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

    describe('findCallback', () => {

        it('should return callback from first parameter', (done) => {

            const callback = () => {};

            const sut = Helpers.findCallback(callback);

            expect(sut).to.be.a.function();
            done();
        });

        it('should return callback from second parameter when first parameter is defined as an object', (done) => {

            const callback = () => {};
            const options = {};

            const sut = Helpers.findCallback(options, callback);

            expect(sut).to.be.a.function();
            done();
        });

        it('should return callback from second parameter when first parameter is undefined', (done) => {

            const callback = () => {};

            const sut = Helpers.findCallback(undefined, callback);

            expect(sut).to.be.a.function();
            done();
        });

        it('should return callback from second parameter when first parameter is null', (done) => {

            const callback = () => {};

            const sut = Helpers.findCallback(null, callback);

            expect(sut).to.be.a.function();
            done();
        });

        it('should return undefined when first parameter is defined as an object', (done) => {

            const sut = Helpers.findCallback({});

            expect(sut).to.be.undefined();
            done();
        });

        it('should return undefined when first parameter and second parameters are undefined', (done) => {

            const sut = Helpers.findCallback(undefined, undefined);

            expect(sut).to.be.undefined();
            done();
        });
    });
});
