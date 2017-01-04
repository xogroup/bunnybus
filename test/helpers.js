'use strict';

const Code = require('code');
const Lab = require('lab');
const Async = require('async');
const Helpers = require('../lib/helpers');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('helpers', () => {

    describe('createTransactionId', () => {

        it('should create an 8 character long alphanumeric token', (done) => {

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
});
