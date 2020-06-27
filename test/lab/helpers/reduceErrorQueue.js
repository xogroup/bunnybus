'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('reduceErrorQueue', () => {
        describe('validation', () => {
            it('should return undefined when defaultQueue is not a string', async () => {
                expect(Helpers.reduceErrorQueue({})).to.be.undefined();
                expect(Helpers.reduceErrorQueue(1)).to.be.undefined();
            });

            it('should return undefined when globalQueue is not a string', async () => {
                expect(Helpers.reduceErrorQueue(undefined, {})).to.be.undefined();
                expect(Helpers.reduceErrorQueue(undefined, 1)).to.be.undefined();
            });

            it('should return undefined when localQueue is not a string', async () => {
                expect(Helpers.reduceErrorQueue(undefined, undefined, {})).to.be.undefined();
                expect(Helpers.reduceErrorQueue(undefined, undefined, 1)).to.be.undefined();
            });
        });

        describe('priority', () => {
            it('should return undefined when nothing is supplied', async () => {
                expect(Helpers.reduceErrorQueue()).to.be.undefined();
            });

            it('should return localQueue when everything is supplied', async () => {
                expect(Helpers.reduceErrorQueue('d', 'g', 'l')).to.equal('l');
            });

            it('should return localQueue when local and default queue is supplied', async () => {
                expect(Helpers.reduceErrorQueue('d', null, 'l')).to.equal('l');
            });

            it('should return localQueue when only local queue is supplied', async () => {
                expect(Helpers.reduceErrorQueue(null, null, 'l')).to.equal('l');
            });

            it('should return globalQueue when global and default queue is supplied', async () => {
                expect(Helpers.reduceErrorQueue('d', 'g')).to.equal('g');
            });

            it('should return defaultQueue when only default queue is supplied', async () => {
                expect(Helpers.reduceErrorQueue('d')).to.equal('d');
            });
        });
    });
});
