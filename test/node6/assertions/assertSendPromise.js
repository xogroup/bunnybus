'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertSendPromise = (instance, message, queueName, transactionId, source, routeKey, miscOptions) => {

    const options = {
        transactionId,
        source,
        routeKey
    };

    if (typeof miscOptions === 'object' && miscOptions !== null){
        Object.assign(options, miscOptions);
    }

    return instance.send(message, queueName, options)
        .then(() => {

            return instance.get(queueName, null);
        })
        .then((payload) => {

            const sentMessage = JSON.parse(payload.content.toString());

            expect(sentMessage).to.be.equal(message);
            expect(payload.properties.headers.transactionId).to.be.string();
            expect(payload.properties.headers.createdAt).to.exist();

            if (source) {
                expect(payload.properties.headers.source).to.be.string();
            }

            if (transactionId) {
                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
            }

            if (source) {
                expect(payload.properties.headers.source).to.be.equal(source);
            }

            if (routeKey) {
                expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
            }

            if (message.event) {
                expect(payload.properties.headers.routeKey).to.be.equal(message.event);
            }

            return instance.channel.ack(payload);
        });
};

module.exports = assertSendPromise;
