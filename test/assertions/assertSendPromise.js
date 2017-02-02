'use strict';

const Code = require('code');
const expect = Code.expect;

const assertSendPromise = (instance, message, queueName, transactionId, callingModule) => {

    const options = {
        transactionId,
        callingModule
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

            if (callingModule) {
                expect(payload.properties.headers.callingModule).to.be.string();
            }

            if (transactionId) {
                expect(payload.properties.headers.transactionId).to.equal(transactionId);
            }

            if (callingModule) {
                expect(payload.properties.headers.callingModule).to.equal(callingModule);
            }

            return instance.channel.ack(payload);
        });
};

module.exports = assertSendPromise;
