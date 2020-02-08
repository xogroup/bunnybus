'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Assertions = require('../assertions');
const { Promisify } = require('../../promisify');

const { describe, before, beforeEach, after, it } = exports.lab = Lab.script();
const expect = Code.expect;

describe('Helpers', () => {

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
});
