'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const assertSend = (instance, message, queueName, transactionId, source, callback) => {

    const options = {
        transactionId,
        source
    };

    Async.waterfall([
        instance.send.bind(instance, message, queueName, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        const sentMessage = JSON.parse(payload.content.toString());
        expect(err).to.be.null();
        expect(sentMessage).to.equal(message);
        expect(payload.properties.headers.transactionId).to.be.string();
        expect(payload.properties.headers.createdAt).to.exist();

        if (source) {
            expect(payload.properties.headers.source).to.be.string();
        }

        if (transactionId) {
            expect(payload.properties.headers.transactionId).to.equal(transactionId);
        }

        if (source) {
            expect(payload.properties.headers.source).to.equal(source);
        }

        instance.channel.ack(payload);

        callback();
    });
};

module.exports = assertSend;
