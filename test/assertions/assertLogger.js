'use strict';

const Code = require('code');
const expect = Code.expect;

const assertLogger = (instance, level, inputMessage, callback) => {

    instance.on(`log.${level}`, (message) => {

        expect(message).to.exist();
        expect(message).to.be.a.object();
        expect(message).to.equal(inputMessage);
        callback();
    });

    instance.logger[level](inputMessage);
};

module.exports = assertLogger;
