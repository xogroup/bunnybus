'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
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
});
