'use strict';

const Code = require('code');
const expect = Code.expect;

const assertSendPromise = (instance, message, queueName, transactionId, source) => {

    const options = {
        transactionId,
        source
    };

    return instance.send(message, queueName, options)
        .then(() => {

            return instance.get(queueName, null);
        })
        .then((payload) => {

            const sentMessage = JSON.parse(payload.content.toString());

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

            return instance.channel.ack(payload);
        });
};

module.exports = assertSendPromise;
