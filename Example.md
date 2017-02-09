# Examples

Examples are based on usage of Promises.

- [General usage of publish and subscribe](#general-usage-of-publish-and-subscribe)
- [Integrating with the `SubscriptionManager`](#integrating-with-the-subscriptionmanager)
  -[Fire and Forget](#fire-and-forget)
  -[Fire and Wait for Resolution](#fire-and-wait-for-resolution)

## General usage of publish and subscribe

Configuration and registration of handlers to a couple queues that listens to some events and handles them.

```Javascirpt
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

const handlersForQueue1 = {
    'message_created' : (message, ack, reject, requeue) => {
        
        //write to elasticsearch
        ack();
    }
};

const handlersForQueue2 = {
     'message_deleted' : (message, ack, reject, requeue) => {
        
        //delete from elastic search
        ack();
    }   
}

Promises
    .resolve()
    .then(() => subscribe('queue1', handlersForQueue1))
    .then(() => subscribe('queue2), handlersForQueue2))
    .catch((err) =>  {
        logger.error('failed to subscribe', err);
    });
```

With the above handlers registered, let's publish some events to the bus.

```Javascirpt
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

Promises
    .resolve()
    .then(()) => {
        return bunnyBus.publish({
            id : 23,
            event : 'message-created',
            body : 'hello world'
        });
    })
    .then(()) => {
        return bunnyBus.publish({
            id : 23,
            event : 'message-deleted'
        });
    })
    .catch((err) => {
        logger.error('failed to publish', err);
    })
```

## Integrating with the `SubscriptionManager`

The use of `SubscriptionManager` is completely optional.  There are times when more control of the bus is needed to stop events from being consumed when debugging needs to occur in a runtime environment.  The `SubscriptionManager` allows an entrypoint to stop events from being consumed without stopping the overall process.  Along the same lines, the consuming of events can be restarted.  A facilitation of this could be provided via a HTTP endpoint that is signaled to stop events from being consumed and a handler for this endpoint can call on `SubscriptionManager` to block the intended queue the `BunnyBus` instance is registered for.

### Fire and Forget

```Javascript
const app = require('express')();
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));

app.get('/stopSubscription/:queue', function(req, res) => {

    bunnyBus.subscriptions.block(req.params.queue);
    res.send('success');
});
```

And to unblock the queues

```Javascirpt
app.get('/restartSubscription/:queue', function(req, res) => {

    bunnyBus.subscriptions.unblock(req.params.queue);
    res.send('success');
});
```

### Fire and Wait for Resolution

```Javascript
const app = require('express')();
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));

app.get('/stopSubscription/:queue', function(req, res) => {

    bunnyBus.once(BunnyBus.SUBSCRIBED_EVENT, (queue) => {

        if (queue === req.params.queue) {
            res.send('success');
        }
    })
});
```

And to unblock the queues

```Javascirpt
app.get('/restartSubscription/:queue', function(req, res) => {

    bunnyBus.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

        if (queue === req.params.queue) {
            res.send('success');
        }
    })
});
```

## Logging with `BunnyBus` Logging events

`BunnyBus` allows use of events to observe log events with.  While the `logger` property is an easy way to replace the default logging mechanism with another like `pino` or `winston`, it could be over kill at times when you just want to simply log one log level to the console.

```Javascirpt
const app = require('express')();
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.LOG_INFO_EVENT, (message) => [

    console.log(message);
]);
```