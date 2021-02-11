'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertLogger = async (instance, level, eventName, inputMessage) => {
    await new Promise((resolve) => {
        instance.once(eventName, (message) => {
            expect(message).to.exist();
            expect(message).to.be.an.object();
            expect(message).to.be.equal(inputMessage);
            resolve();
        });

        instance.logger[level](inputMessage);
    });
};

module.exports = assertLogger;
