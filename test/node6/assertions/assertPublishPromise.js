'use strict';

const Code = require('@hapi/code');

const expect = Code.expect;

const assertPublishPromise = (instance, message, queueName, routeKey, transactionId, source, shouldRoute, miscOptions) => {

    const options = {
        routeKey,
        transactionId,
        source
    };

    if (typeof miscOptions === 'object' && miscOptions !== null){
        Object.assign(options, miscOptions);
    }

    return instance.publish(message, options)
        .then(() => {

            return instance.get(queueName);
        })
        .then((payload) => {

            if (shouldRoute) {
                const subscribedMessage = JSON.parse(payload.content.toString());

                expect(subscribedMessage).to.be.equal(message);
                expect(payload.properties.headers.transactionId).to.be.string();
                expect(payload.properties.headers.createdAt).to.exist();

                if (routeKey) {
                    expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
                }
                else {
                    expect(payload.properties.headers.routeKey).to.be.equal(message.event);
                }

                if (source) {
                    expect(payload.properties.headers.source).to.be.string();
                    expect(payload.properties.headers.source).to.be.equal(source);
                }

                if (transactionId) {
                    expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
                }

                instance.channel.ack(payload);
            }
            else {
                expect(payload).to.be.false();
            }
        });
};

module.exports = assertPublishPromise;
