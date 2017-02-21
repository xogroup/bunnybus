'use strict';

const Code = require('code');
const expect = Code.expect;

const assertCustomLogger = (instance, level, inputMessage, callback) => {

    instance.logger = {};
    instance.logger[level] = (message) => {

        expect(message).to.exist();
        expect(message).to.be.a.object();
        expect(message).to.be.equal(inputMessage);
        callback();
    };

    instance.logger[level](inputMessage);
};

module.exports = assertCustomLogger;
