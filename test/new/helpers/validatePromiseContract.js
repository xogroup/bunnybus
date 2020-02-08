'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');
const Q = require('q');
const Bluebird = require('bluebird');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Helpers', () => {

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
});
