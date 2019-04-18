'use strict';

const Helpers = require('../../lib/helpers');
const { expect } = require('@hapi/code');

const assertConvertToBuffer = async (data) => {
    const result = await Helpers.convertToBuffer(data);

    expect(result.buffer).to.be.a.instanceof(Buffer);

    if (Buffer.isBuffer(data)) {
        expect(Buffer.compare(result.buffer, data)).to.be.equal(0);
        expect(result.isBuffer).to.be.true();
    }
    else {
        expect(JSON.parse(result.buffer.toString())).to.be.equal(data);
        expect(result.isBuffer).to.be.false();
    }
};

module.exports = assertConvertToBuffer;
