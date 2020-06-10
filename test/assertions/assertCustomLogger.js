'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertCustomLogger = async (instance, level, inputMessage) => {
    const fakeLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {}
    };

    const promise = new Promise((resolve) => {
        fakeLogger[level] = (message) => {
            expect(message).to.exist();
            expect(message).to.be.an.object();
            expect(message).to.be.equal(inputMessage);

            resolve();
        };
    });

    instance.logger = fakeLogger;

    instance.logger[level](inputMessage);

    await promise;
};

module.exports = assertCustomLogger;
