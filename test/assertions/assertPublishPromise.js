'use strict';

const Code = require('code');
const expect = Code.expect;

const assertPublishPromise = (instance, message, queueName, routeKey, transactionId, source, shouldRoute) => {

    const options = {
        routeKey,
        transactionId,
        source
    };

    return instance.publish(message, options)
        .then(() => {

            return instance.get(queueName);
        })
        .then((payload) => {

            if (shouldRoute) {
                const subscribedMessage = JSON.parse(payload.content.toString());

                expect(subscribedMessage).to.equal(message);
                expect(payload.properties.headers.transactionId).to.be.string();
                expect(payload.properties.headers.createdAt).to.exist();

                if (routeKey) {
                    expect(payload.properties.headers.routeKey).to.equal(routeKey);
                }
                else {
                    expect(payload.properties.headers.routeKey).to.equal(message.event);
                }

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
            }
            else {
                expect(payload).to.be.false();
            }
        });
};

module.exports = assertPublishPromise;
