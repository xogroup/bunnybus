'use strict';

const Helpers = require('../../lib/helpers');
const { expect } = require('@hapi/code');

const assertConvertToBuffer = async (data) => {
    const { buffer, isBuffer } = await Helpers.convertToBuffer(data);

    expect(buffer).to.be.a.instanceof(Buffer);

    if (Buffer.isBuffer(data)) {
        expect(Buffer.compare(buffer, data)).to.be.equal(0);
        expect(isBuffer).to.be.true();
    }
    else {
        expect(JSON.parse(buffer.toString())).to.be.equal(data);
        expect(isBuffer).to.be.false();
    }
};

module.exports = assertConvertToBuffer;
