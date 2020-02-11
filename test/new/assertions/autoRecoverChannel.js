'use strict';

const { ChannelManager, ConnectionManager } = require('../../../lib/states');
const Helpers = require('../../../lib/helpers');

const autoRecoverChannel = async (testFuncAsync, connectionContext, channelContext, channelManager) => {

    const promise = new Promise((resolve) => {

        let handled = false;

        connectionContext
            .removeAllListeners(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT)
            .once(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT, () => {

                if (!handled) {
                    handled = true;
                    resolve();
                }
            });

        channelContext
            .removeAllListeners(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT)
            .once(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, () => {

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
