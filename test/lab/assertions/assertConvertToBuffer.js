'use strict';

const Helpers = require('../../../lib/helpers');
const Code = require('@hapi/code');

const expect = Code.expect;

const assertConvertToBuffer = (data) => {
    let sut = null;

    try {
        const result = Helpers.convertToBuffer(data);

        expect(result.buffer).to.be.a.instanceof(Buffer);

        if (Buffer.isBuffer(data)) {
            expect(Buffer.compare(result.buffer, data)).to.be.equal(0);
            expect(result.isBuffer).to.be.true();
        } else {
            expect(JSON.parse(result.buffer.toString())).to.be.equal(data);
            expect(result.isBuffer).to.be.false();
        }
    } catch (err) {
        sut = err;
    }

    expect(sut).to.not.exist();
};

module.exports = assertConvertToBuffer;
