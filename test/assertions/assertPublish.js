'use strict';

const Async = require('async');
const Code = require('code');
const expect = Code.expect;

const assertPublish = (instance, message, queueName, routeKey, transactionId, source, shouldRoute, callback) => {

    const options = {
        routeKey,
        transactionId,
        source
    };

    Async.waterfall([
        instance.publish.bind(instance, message, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        if (shouldRoute) {
            const subscribedMessage = JSON.parse(payload.content.toString());
            expect(err).to.be.null();
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
            expect(err).to.be.null();
            expect(payload).to.be.false();
        }

        callback();
    });
};

module.exports = assertPublish;
