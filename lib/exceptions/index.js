'use strict';

module.exports = {
    NoConnectionError       : require('./noConnectionError'),
    NoChannelError          : require('./noChannelError'),
    NoHeaderFieldError      : require('./noHeaderFieldError'),
    NoRouteKeyError         : require('./noRouteKeyError'),
    SubscriptionExistError  : require('./subscriptionExistError'),
    SubscriptionBlockedError: require('./subscriptionBlockedError'),
    IncompatibleLoggerError : require('./incompatibleLoggerError')
};
