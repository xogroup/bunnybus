# Examples

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [General usage of publish and subscribe](#general-usage-of-publish-and-subscribe)
- [Publish and subscribe using RabbitMQ topic exchange wildcards](#publish-and-subscribe-using-rabbitmq-topic-exchange-wildcards)
- [Integrating with the `SubscriptionManager`](#integrating-with-the-subscriptionmanager)
  - [Fire and Forget](#fire-and-forget)
  - [Fire and Wait for Resolution](#fire-and-wait-for-resolution)
- [Logging with `BunnyBus` Logging events](#logging-with-bunnybus-logging-events)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## General usage of publish and subscribe

Configure and register handlers to a couple queues. When a subscribed event is published to one of those queues, it will be processed by the handler.

```javascript
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

const handlersForQueue1 = {
    'message_created' : async (message, ack, reject, requeue) => {
        
        //write to elasticsearch
        await ack();
    }
};

const handlersForQueue2 = {
    'message_deleted' : async (message, ack, reject, requeue) => {
        
        //delete from elastic search
        await ack();
    }   
}

try {
    await Promise.all([
        subscribe('queue1', handlersForQueue1),
        subscribe('queue2', handlersForQueue2)
    ]);
}
catch (err) {
    logger.error('railed to subscribe', err);
}
```

With the above handlers registered, let's publish some events to the bus.

```javascript
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

try {
    await Promise.all([
        bunnyBus.publish({
            id : 23,
            event : 'message-created',
            body : 'hello world'
        }),
        bunnyBus.publish({
            id : 23,
            event : 'message-deleted'
        })
    ]);
}
catch (err) {
    logger.error('failed to publish', err);
}
```

## Publish and subscribe using RabbitMQ topic exchange wildcards

Configuration and registration of handlers to a couple queues that listens to some events and handles them.

```javascript
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

const handlers = {
    'email.*' : async (message, ack, reject, requeue) => {

        //do work
        await ack();
    },
    'voicemail.#' : async (message, ack, reject, requeue) => {

        //do work
        await ack();
    }
};

try {
    await subscribe('communictionQueue', handlers);
}
catch (err) {
    logger.error('failed to subscribe', err);
}
```

With the above handlers registered, let's publish some events to the bus.

```javascript
const config = require('ez-config');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus(config.get('rabbit'));
const logger = require('pino');

bunnyBus.logger = logger;

try {
    // this will make it to the queue and subscribed handler
    await bunnyBus.publish({
        id : 1001,
        event : 'email.created',
        body : 'hello world'
    });

    // this will not make it to the queue because the wildcard
    // assigned by the subscribing handler will not catch this route
    await bunnyBus.publish({
        id : 1002,
        event : 'email.created.highpriority',
        body : 'hello world on fire'
    });

    // this will not make it to the queue because the wildcard
    // assigned by the subscribing handler will not catch this route
    await bunnyBus.publish({
        id : 9001,
        event : 'voicemail.crated.lowpriority'
        body : 'translation was world hello'
    });
}
catch (err) {
    logger.error('failed to publish', err);
}
```

## Integrating with the `SubscriptionManager`

The use of `SubscriptionManager` is completely optional.  When debugging needs to occur in a runtime environment or during a deployment, it can be helpful to temporarily stop events from being consumed.  The `SubscriptionManager` provides an entrypoint to stop events from being consumed without stopping the overall process.  Along the same lines, the consumption of events can be restarted with the `SubscriptionManager`.  For example, you could create an HTTP endpoint to pause a queue so that events aren't processed. In the handler for this hypothetical endpoint, you would invoke `SubscriptionManager` to block the target queue that the `BunnyBus` instance is subscribed to.

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

```javascript
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
    });

    bunnyBus.subscriptions.block(req.params.queue);
});
```

And to unblock the queues

```javascript
app.get('/restartSubscription/:queue', function(req, res) => {

    bunnyBus.once(BunnyBus.UNSUBSCRIBED_EVENT, (queue) => {

        if (queue === req.params.queue) {
            res.send('success');
        }
    });

    bunnyBus.subscriptions.unblock(req.params.queue);
});
```

## Logging with `BunnyBus` Logging events

`BunnyBus` allows for logging to be used in conjunction with events.  While the `logger` property is an easy way to replace the default logging mechanism with another like `pino` or `winston`, it could be overkill at times when you just want to simply log one log level to the console.

```javascript
const app = require('express')();
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.LOG_INFO_EVENT, (message) => [

    console.log(message);
]);
```
