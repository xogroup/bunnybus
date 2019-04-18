'use strict';

const { expect } = require('@hapi/code');

const assertCustomLogger = async (instance, level, inputMessage) => {
    await new Promise(async (resolve) => {
        instance.logger = {};
        instance.logger[level] = (message) => {
            expect(message).to.exist();
            expect(message).to.be.a.object();
            expect(message).to.be.equal(inputMessage);
            resolve();
        };

        instance.logger[level](inputMessage);
    });
};

module.exports = assertCustomLogger;
