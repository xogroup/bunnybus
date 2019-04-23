'use strict';

const { expect } = require('@hapi/code');

const assertCustomLogger = async (instance, level, inputMessage) => {
    instance.logger = {
        [level]: async (message) => {
            expect(message).to.exist();
            expect(message).to.be.a.object();
            expect(message).to.be.equal(inputMessage);
        }
    };

    await instance.logger[level](inputMessage);
};

module.exports = assertCustomLogger;
