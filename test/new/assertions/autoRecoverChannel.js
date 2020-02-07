'use strict';

const Events = require('../../../lib/events');
const Helpers = require('../../../lib/helpers');

const autoRecoverChannel = async (testFuncAsync, connectionContext, channelContext, channelManager) => {

    const promise = new Promise((resolve) => {

        let handled = false;

        connectionContext
            .removeAllListeners(Events.AMQP_CONNECTION_CLOSE_EVENT)
            .once(Events.AMQP_CONNECTION_CLOSE_EVENT, () => {

                if (!handled) {
                    handled = true;
                    resolve();
                }
            });

        channelContext
            .removeAllListeners(Events.AMQP_CHANNEL_CLOSE_EVENT)
            .once(Events.AMQP_CHANNEL_CLOSE_EVENT, () => {

                if (!handled) {
                    handled = true;
                    resolve();
                }
            });
    });

    await testFuncAsync();

    try {
        await Helpers.timeoutAsync(async () => await promise, 500);
    }
    catch (err) {
        if (err.Message !== 'Timeout occurred') {
            throw err;
        }
    }
    finally {
        await channelManager.create(channelContext.name, channelContext.connectionContext, channelContext.channelOptions);
    }
};

module.exports = autoRecoverChannel;
