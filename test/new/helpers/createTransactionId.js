'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Async = require('async');
const Helpers = require('../../../lib/helpers');
const { Promisify } = require('../../promisify');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Helpers', () => {

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
});
