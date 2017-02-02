'use strict';

const Code = require('code');
const expect = Code.expect;

const assertPublishPromise = (instance, message, queueName, routeKey, transactionId, callingModule, shouldRoute) => {

    const options = {
        routeKey,
        transactionId,
        callingModule
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

                if (callingModule) {
                    expect(payload.properties.headers.callingModule).to.be.string();
                }

                if (transactionId) {
                    expect(payload.properties.headers.transactionId).to.equal(transactionId);
                }

                if (callingModule) {
                    expect(payload.properties.headers.callingModule).to.equal(callingModule);
                }

                instance.channel.ack(payload);
            }
            else {
                expect(payload).to.be.false();
            }
        });
};

module.exports = assertPublishPromise;
