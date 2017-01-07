'use strict';

const Helpers = require('../../lib/helpers');
const Code = require('code');
const expect = Code.expect;

const AssertConvertToBuffer = (data, callback) => {

    Helpers.convertToBuffer(data, (err, result) => {

        expect(result).to.be.a.instanceof(Buffer);

        if (Buffer.isBuffer(data)) {
            expect(Buffer.compare(result, data)).to.equal(0);
        } 
        else {
            expect(JSON.parse(result.toString())).to.equal(data);
        }

        callback();
    });
}

module.exports = AssertConvertToBuffer;
