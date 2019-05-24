# 2.0.0 API Reference

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [2.0.0 API Reference](#200-api-reference)
  - [BunnyBus](#bunnybus)
    - [Versioning](#versioning)
    - [`new BunnyBus(config)`](#new-bunnybusconfig)
      - [Getters and Setters](#getters-and-setters)
        - [`config`](#config)
        - [`subscriptions`](#subscriptions)
        - [`logger`](#logger)
        - [`connectionString`](#connectionstring)
        - [`connection`](#connection)
        - [`hasConnection`](#hasconnection)
        - [`channel`](#channel)
        - [`hasChannel`](#haschannel)
    - [Public API](#public-api)
      - [`createExchange(name, type, [options])`](#createexchangename-type-options)
        - [parameter(s)](#parameters)
      - [`deleteExchange(name, [options)`](#deleteexchangename-options)
        - [parameter(s)](#parameters-1)
      - [`checkExchange(name)`](#checkexchangename)
        - [parameter(s)](#parameters-2)
      - [`createQueue(name, [options)`](#createqueuename-options)
        - [parameter(s)](#parameters-3)
      - [`deleteQueue(name, [options)`](#deletequeuename-options)
        - [parameter(s)](#parameters-4)
      - [`checkQueue(name)`](#checkqueuename)
        - [parameter(s)](#parameters-5)
      - [`publish(message, [options])`](#publishmessage-options)
        - [parameter(s)](#parameters-6)
      - [`subscribe(queue, handlers, [options])`](#subscribequeue-handlers-options)
        - [parameter(s)](#parameters-7)
        - [handlers](#handlers)
        - [`key`](#key)
        - [`handler`](#handler)
      - [`unsubscribe(queue)`](#unsubscribequeue)
        - [parameter(s)](#parameters-8)
      - [`send(message, queue, [options])`](#sendmessage-queue-options)
        - [note(s)](#notes)
        - [parameter(s)](#parameters-9)
      - [`get(queue, [options])`](#getqueue-options)
        - [parameter(s)](#parameters-10)
      - [`getAll(queue, handler, [options])`](#getallqueue-handler-options)
        - [parameter(s)](#parameters-11)
    - [Internal-use Methods](#internal-use-methods)
      - [`_recoverConnectChannel()`](#recoverconnectchannel)
      - [`_createConnection()`](#createconnection)
      - [`_closeConnection()`](#closeconnection)
      - [`_createChannel()`](#createchannel)
      - [`_closeChannel()`](#closechannel)
  - [Events (`EventEmitter`)](#events-eventemitter)
    - [`BunnyBus.Events.LOG_DEBUG`](#bunnybuseventslogdebug)
      - [event key](#event-key)
      - [handler parameter(s)](#handler-parameters)
    - [`BunnyBus.Events.LOG_TRACE`](#bunnybuseventslogtrace)
      - [event key](#event-key-1)
      - [handler parameter(s)](#handler-parameters-1)
    - [`BunnyBus.LOG_INFO`](#bunnybusloginfo)
      - [event key](#event-key-2)
      - [handler parameter(s)](#handler-parameters-2)
    - [`BunnyBus.Events.LOG_WARN`](#bunnybuseventslogwarn)
      - [event key](#event-key-3)
      - [handler parameter(s)](#handler-parameters-3)
    - [`BunnyBus.Events.LOG_ERROR`](#bunnybuseventslogerror)
      - [event key](#event-key-4)
      - [handler parameter(s)](#handler-parameters-4)
    - [`BunnyBus.Events.LOG_FATAL`](#bunnybuseventslogfatal)
      - [event key](#event-key-5)
      - [handler parameter(s)](#handler-parameters-5)
    - [`BunnyBus.Events.PUBLISHED`](#bunnybuseventspublished)
      - [event key](#event-key-6)
      - [handler parameter(s)](#handler-parameters-6)
    - [`BunnyBus.Events.SUBSCRIBED`](#bunnybuseventssubscribed)
      - [event key](#event-key-7)
      - [handler parameter(s)](#handler-parameters-7)
    - [`BunnyBus.Events.UNSUBSCRIBED`](#bunnybuseventsunsubscribed)
      - [event key](#event-key-8)
      - [handler parameter(s)](#handler-parameters-8)
    - [`BunnyBus.Events.RECOVERING`](#bunnybuseventsrecovering)
      - [event key](#event-key-9)
    - [`BunnyBus.Events.RECOVERED`](#bunnybuseventsrecovered)
      - [event key](#event-key-10)
    - [`BunnyBus.Events.FATAL`](#bunnybuseventsfatal)
      - [event key](#event-key-11)
    - [`BunnyBus.Events.AMQP_CONNECTION_ERROR`](#bunnybuseventsamqpconnectionerror)
      - [event key](#event-key-12)
      - [handler parameter(s)](#handler-parameters-9)
    - [`BunnyBus.Events.AMQP_CONNECTION_CLOSE`](#bunnybuseventsamqpconnectionclose)
      - [event key](#event-key-13)
      - [handler parameter(s)](#handler-parameters-10)
    - [`BunnyBus.Events.AMQP_CHANNEL_ERROR`](#bunnybuseventsamqpchannelerror)
      - [event key](#event-key-14)
      - [handler parameter(s)](#handler-parameters-11)
    - [`BunnyBus.Events.AMQP_CHANNEL_CLOSE`](#bunnybuseventsamqpchannelclose)
      - [event key](#event-key-15)
      - [handler parameter(s)](#handler-parameters-12)
  - [`SubscriptionManager`](#subscriptionmanager)
    - [`contains(queue, [withConsumerTag])`](#containsqueue-withconsumertag)
    - [`create(queue, handlers, [options])`](#createqueue-handlers-options)
    - [`tag(queue, consumerTag)`](#tagqueue-consumertag)
    - [`get(queue)`](#getqueue)
    - [`clear(queue)`](#clearqueue)
    - [`clearAll()`](#clearall)
    - [`remove(queue)`](#removequeue)
    - [`list()`](#list)
    - [`block(queue)`](#blockqueue)
    - [`unblock(queue)`](#unblockqueue)
  - [Error Types](#error-types)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## BunnyBus

`BunnyBus` is a class that instantiates into a singleton.  It hosts all features for communicating with RabbitMQ to provide an easy to use enterprise bus facade.

### Versioning

A note regarding versioning:  `BunnyBus` attaches the version value found in its `package.json` file to all messages that are sent.  By default, any messages that are picked up from a subscribed queue which do not match the major semver will be rejected to the error queue.  As an example, message sent from BunnyBus version `1.2.3` will only be accepted from other `BunnyBus` clients with semver range of `1.x.x`.

### `new BunnyBus(config)`

Creates a new singleton instance of `bunnybus`. Accepts a configuration parameter. See [`config`](#config) for allowed options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus({ server : 'red-bee.cloudamqp.com' });

//do work;
```

#### Getters and Setters

##### `config`

Setter and Getter for singleton configuration. Accepts the following optional properties:

 * `ssl` - value for creating a secure connection.  Used in the connection string.  Defaults to `false`. *[boolean]* **Optional**
 * `user` - value of the username.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `password` - value of the password.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `server` - value of the server address.  Just the host portion of the URI.  eg `red-bee.cloudamqp.com` or `rabbitbox` or `56.23.0.123`.  Used in the connection string.  Defaults to `127.0.0.1`. *[string]* **Optional**
 * `port` - value of the port for client connections.  Used in the conneciton string.  Defaults to `5672`. *[number]* **Optional**
 * `vhost` - value of the virtual host the user connects to.  Used in the connection string.  Defaults to `%2f`. *[string]* **Optional**
 * `heartbeat` -  value negotiated between client and server on when the TCP tunnel is considered dead.  Unit is a measurement of seconds.  Used in the connection string.  Defaults to `60`. *[number]* **Optional**
 * `globalExchange` - value of the exchange to transact through for message publishing.  This is the default used when one is not provided within the `options` for any `BunnyBus` methods that supports one transactionally.  Defaults to `default-exchange`. *[string]* **Optional**
 * `prefetch` - value of the maximum number of unacknowledged messages allowable in a channel.  Defaults to `5`. *[number]* **Optional**
 * `errorQueue` - name of the queue where rejected messages will be sent to.  Defaults to `error-bus`. *[string]* **Optional**
 * `maxRetryCount` - maximum amount of attempts a message can be requeued.  This is the default used when one is not provided within the `options` for any `BunnyBus` methods that supports one transactionally. Defaults to `10`. *[number]* **Optional**
 * `validatePublisher` - flag to dictate if the publishing source for messages being consumed must be `bunnyBus`.  This is a safe guard to prevent unexpected message sources from entering the subscribing realm. A value of `bunnyBus` is stamped as a header property on the message during `publish()`.  The `subscribe()` method will use the same value for authentication.  Consumers detecting mismatched publishers will auto reject the message into an error queue.  Defaults to `false`. *[boolean]* **Optional**
 * `validateVersion` - flag to dictate if major semver should be matched as part of the message subscription valiation.  This is a safe guard to prevent mismatched `bunnyBus` drivers from pub/sub to each other.  Consumers detecting mismatched major values will auto reject the message into an error queue.  In order for this layer of validation to occur, `validatePublisher` must be allowed because the version value is set against the `bunnyBus` header.   Defaults to `false`. *[boolean]* **Optional**
* `autoRecovery` - flag to control reconnection attempts after losing connection with the server. Defaults to `true`. *[boolean]* **Optional**
* `autoRecoveryRetryCount` - tells how many attempts to reconnect. Defaults to `3`. *[number]* **Optional**

Note that updates in the options directed at changing connection string will not take affect immediately.  [`_closeConnection()`](#_closeConnectioncallback) needs to be called manually to invoke a new connection with new settings.

  ```javascript
  const BunnyBus = require('bunnybus');
  const bunnyBus = new BunnyBus();

  //deferred configuration
  bunnyBus.config = { server : 'red-bee.cloudamqp.com'};

  //do work
  ```

##### `subscriptions`

Getter for subscriptions.  A reference to the [Subscription Manager](#subscriptionmanager).

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.subscriptions.get('queue'));

//output : { queue : 'queue1', consumerTag : 'abc123', handlers : {}, options : {}}
```

##### `logger`

Setter and Getter for logger.  By default, `BunnyBus` will instantiate and set a logger using the `EventEmitter`.  When a custom logger is set, `BunnyBus` will **no** longer emit log messages through the `EventEmitter`.  The Setter will also validate the contract of the logger to ensure the following keys exist [`debug`, `info`, `warn`, `error`, `fatal`] and are of type `Function`.  When validation fails, the existing logger will not be overriden.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const logHandler = (message) => {

    //log something to some where
};

//custom logger
bunnyBus.logger = {
    info  = logHandler,
    debug = logHandler,
    warn  = logHandler,
    error = logHandler,
    fatal = logHandler
};
```

##### `connectionString`

Getter for AMQP connection string.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.connectionString);
//output : amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000
```

##### `connection`

Setter and Getter for AMQP connection object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a connection has to be manually set, it is highly recommended to do so before any other operation have been invoked.

```javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

Amqp.connect('<connection-string>', (err, connection) => {
    bunnyBus.connection = connection;
});
```

##### `hasConnection`

Getter to check the existence of an active AMQP connection object.

```javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasConnection;
//true|false
```

##### `channel`

Setter and Getter for AMQP confirmation channel object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a channel has to be manually set, it is highly recommended to do so before any other operation have been invoked.

```javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connection.createConfirmationChannel((err, channel) => {
    bunnyBus.channel = channel;
});
```

##### `hasChannel`

Getter for existence for an active AMQP channel object

```javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasChannel;
//true|false
```

### Public API

The following methods are the primary-use methods you should utilize for managing exchanges and queues and for sending and getting messages.

#### `createExchange(name, type, [options])`

Creates an exchange.

##### parameter(s)

  - `name` - name of the exchange to be created. *[string]* **Required**
  - `type` - type of exchange to create. Possible values are (`direct`, `fanout`, `header`, `topic`) *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) are proxied through to amqplib `assertExchange`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.createExchange('default-exchange', 'topic');
```

#### `deleteExchange(name, [options)`

Delete an exchange.

##### parameter(s)

  - `name` - name of the exchange to be deleted. *[string]* **Required**
  - `options` - optional settings. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteExchange) are proxed through to amqplib `deleteExchange`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.deleteExchange('default-exchange');
```

#### `checkExchange(name)`

Checks if an exchange exists.  The channel closes when the exchange does not exist.

##### parameter(s)

  - `name` - name of the exchange to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkExchange('default-exchange');
```

#### `createQueue(name, [options)`

Creates a queue.

##### parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.createQueue('queue1');
```

#### `deleteQueue(name, [options)`

Delete a queue.

##### parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue) are proxied through to amqplib `deleteQueue`. *[Object]* **Optional**
 
```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.deleteQueue('queue1');
```

#### `checkQueue(name)`

Checks if a queue exists.  The channel closes when the queue does not exist.

##### parameter(s)

  - `name` - name of the queue to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkQueue('queue1');
```

#### `publish(message, [options])`

Publish a message onto the bus.

##### parameter(s)

  - `message` - the content being sent to downstream subscribers. *[string|Object|Buffer]* **Required**
   - `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
  - `options` - optional settings. *[Object]* **Optional**
    - `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]* **Optional**
    - `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]* **Optional**
    - `source` - value attached to the header of the message to help with track the origin of messages in your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]* **Optional**
    - `globalExchange` - value to override the exchange specified in `config`. *[string]* **Optional**
    - In addition to the above options, all of `amqplib`'s [configuration options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) (except for `headers` and `immediate`) from its `sendToQueue` and `publish` methods can also be passed as top-level properties in the `publish` options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    event : 'some.routeKey'
    // other stuff you want to send
}

await bunnyBus.publish(message);
```

#### `subscribe(queue, handlers, [options])`

Subscribe to messages from a given queue.

##### parameter(s)

  - `queue` - the name of the queue to subscribe messages to. A queue with the provided name will be created if one does not exist. *[string]* **Required**
  - `handlers` - a `key` / `handler` hash where the key reflects the name of the `message.event` or `routeKey`.  And the handler reflects a `Function` as `(message, [meta, [ack, [reject, [requeue]]]]) => {}`. *[Object]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `queue` - settings for the queue. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
    - `globalExchange` - value of the exchange to transact through for message publishing.  Defaults to one provided in the [config](#config). *[string]* **Optional**
    - `maxRetryCount` - maximum amount of attempts a message can be requeued.  Defaults to one provided in the [config](#config). *[number]* **Optional**
    - `validatePublisher` - flag for validating messages having `bunnyBus` header.  More info can be found in [config](#config). Defaults to one provided in the [config](#config). *[boolean]* **Optional**
    - `validateVersion` - flag for validating messages generated from the same major version.  More info can be found in [config](#config). Defaults to one provided in the [config](#config). *[boolean]* **Optional**
    - `meta` - allows for meta data regarding the payload to be returned.  Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.  Turning this on will adjust the handler to be a `Function` as `(message, meta, [ack, [reject, [requeue]]]) => {}`. *[boolean]* **Optional**

##### handlers

##### `key`

A `key` is the routeKey in RabbitMQ terminology.  `BunnyBus` specifically leverages [topic exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html) to route a message from the exchange to any number of queues that are subscribed.  The keys are normally dot notated and wild cards of `*` (can substitute for exactly one word) and `#` (can substitute for zero or more words).  Keys can look like `vineyard.wine-produced`, `vineyard.wine-sold`, `vineyard.*`, `vineyard.#` and etc...  A bug was found during this implementation regarding expected behavior of wildcard syntax [here](https://github.com/rabbitmq/rabbitmq-server/issues/1383)

##### `handler`

A `handler` is an async function which contains the following arity.  Order matters.
  - `message` is what was received from the bus.  The message does represent the RabbitMQ `'payload.content` buffer.  The original source of this object is from `payload.content`.
  - `meta` is only available when `options.meta` is set to `true`.  This object will contain all payload related meta information like `payload.properties.headers`. Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.
  - `ack([option])` is an async function for acknowledging the message off the bus.
    - `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
  - `reject([option])` is an async function for rejecting the message off the bus to a predefined error queue.  The error queue is named by default `<your queue name>_error`.  It will also short circuit to `error_bus` when defaults can't be found.
    - `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
  - `requeue()` is an async function for requeuing the message back to the back of the queue.  This is feature circumvents Rabbit's `nack` RPC.  `nack` natively requeues but pushes the message to the front of the queue.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const handlers = {
    route.event1 : async (message, ack, reject, requeue) => {
        await ack();
    },
    route.event2 : async (message, ack, reject, requeue) => {
        if (//something not ready) {
            await requeue();
        } else {
            await ack();
        }
    }
}

await bunnyBus.subscribe('queue', handlers);
```

#### `unsubscribe(queue)`

Unsubscribe from listening to a queue.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  
```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.unsubscribe('queue1');
```

#### `send(message, queue, [options])`

Send a message directly to a specified queue.

##### note(s)

When `message.event` or `options.routeKey` values are not provided for `routeKey` addressing.  The message will be lost when [`subcribe()`](#subscribequeue-handlers-options-callback) handles the queue because messages without a `routeKey` are discarded.

##### parameter(s)

  - `message` - the content being sent directly to specfied queue. *[string|Object|Buffer]* **Required**
   - `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]* **Optional**
    - `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
    - `source` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]*  **Optional**
    - In addition to the above options, all of `amqplib`'s [configuration options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) (except for `headers` and `immediate`) from its `sendToQueue` and `publish` methods can also be passed as top-level properties in the `send` options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    // other stuff you want to send
}

await bunnyBus.send(message, 'queue1');
```

#### `get(queue, [options])`

Pop a message directly off a queue.  The payload returned is the RabbitMQ `payload` with `payload.properties` and `payload.content` in its original form.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.get('queue1');
```

#### `getAll(queue, handler, [options])`

Pop all messages directly off of a queue until there are no more.  Handler is called for each message that is popped.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `handler` - a handler reflects a `Function` as `async (message, [meta, [async ack]]) => {}`. *[Function]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `get` - [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**
    - `meta` - allows for meta data regarding the payload to be returned.  Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.  Turning this on will adjust the handler to be a `Function` as `async (message, meta, [async ack]) => {}`.  *[boolean]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const handler = async (message, ack) => {
    await ack();
}

await bunnyBus.getAll('queue1', handler);
```

### Internal-use Methods

The following methods are available in the public API, but manual use of them is highly discouraged.
Please see the [Public API](#public-api) for the primary BunnyBus methods.

#### `_recoverConnectChannel()`

Auto retry mechanism when to restore either a connection or channel when it gets closed.  The retry mechanism will attempt `config.autoRecoveryRetryCount` times with randomnly generated wait seconds (up to 10 seconds) between reconnect attempts.  

`BunnyBus.Events.RECOVERING` will be emitted once this function gets invoked and `BunnyBus.Events.RECOVERED` once sucessfully restored the connection.

When a connection can not be restored error will be thrown and `BunnyBus.Events.FATAL` with error object will be emitted.

This function is invoked internally through error handlers.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

// something bad happened
try {
  await bunnyBus._recoverConnectChannel();
}
catch(error) {
// something horrible happened
  process.exit(1);
}
```

#### `_createConnection()`

Create a connection from settings defined through custom or default configurations.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus._createConnection();
```

#### `_closeConnection()`

Closes an opened connection if one exists.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus._closeConnection();
```

#### `_createChannel()`

Create a channel from an existing connection.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus._createChannel();
```

#### `_closeChannel()`

Closes an channel if one exists.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus._closeChannel();
```

## Events (`EventEmitter`)

`BunnyBus` extends `EventEmitter` for emitting logs and system specific events.  Subscription to these events is optional, except for `BunnyBus.Events.FATAL` which indicates unable to open a connection and something that needs to be dealt within your code.
`BunnyBus` class also exposes static Getter properties for the name of these public events.

### `BunnyBus.Events.LOG_DEBUG`

#### event key

* `log.debug` - debug level logging message.

#### handler parameter(s)

* `message` - debug message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_DEBUG, pino.debug);
```

### `BunnyBus.Events.LOG_TRACE`

#### event key

* `log.trace` - trace level logging message.

#### handler parameter(s)

* `message` - debug message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_TRACE, pino.trace);
```

### `BunnyBus.LOG_INFO`

#### event key

* `log.info` - info level logging message.

#### handler parameter(s)

* `message` - info message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_INFO, pino.info);
```

### `BunnyBus.Events.LOG_WARN`

#### event key

* `log.warn` - warn level logging message.

#### handler parameter(s)

* `message` - warn message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_WARN, pino.warn);
```

### `BunnyBus.Events.LOG_ERROR`

#### event key

* `log.error` - error level logging message.

#### handler parameter(s)

* `message` - error message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_ERROR, pino.error);
```

### `BunnyBus.Events.LOG_FATAL`

#### event key

* `log.fatal` - fatal level logging message.

#### handler parameter(s)

* `message` - fatal message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on(BunnyBus.Events.LOG_FATAL, pino.fatal);
```

### `BunnyBus.Events.PUBLISHED`

#### event key

* `bunnybus.published` - emitted when [`publish()`](#publishmessage-options-callback) is successfully called.

#### handler parameter(s)

* `message` - original payload published. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.PUBLISHED, (message) => {});
```

### `BunnyBus.Events.SUBSCRIBED`

#### event key

* `bunnybus.subscribed` - emitted when [`subcribe()`](#subscribequeue-handlers-options-callback) is successfully called.

#### handler parameter(s)

* `queue` - name of queue subcribed for. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.SUBSCRIBED, (queue) => {});
```

### `BunnyBus.Events.UNSUBSCRIBED`

#### event key

* `bunnybus.unsubscribed` - emitted when [`unsubcribe()`](#unsubscribequeue-callback) is successfully called.

#### handler parameter(s)

* `queue` - name of queue unsubscribed from. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.UNSUBSCRIBED, (queue) => {});
```

### `BunnyBus.Events.RECOVERING`

#### event key

* `bunnybus.recovering` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is first invoked.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.RECOVERING, () => {});
```

### `BunnyBus.Events.RECOVERED`

#### event key

* `bunnybus.recovered` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is successfully restores connection and channel.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.RECOVERED, () => {});
```

### `BunnyBus.Events.FATAL`

#### event key

* `bunnybus.fatal` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is unable to restore connection. At this point `BunnyBus` is not operational and invoking functions will result in errors being thrown.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.RECOVERED, () => {
  process.exit(1);
});
```

### `BunnyBus.Events.AMQP_CONNECTION_ERROR`

#### event key

* `amqp.connection.error` - emitted when amqplib encounters a corrupted connection state.
#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.AMQP_CONNECTION_ERROR, (err) => {});
```

### `BunnyBus.Events.AMQP_CONNECTION_CLOSE`

#### event key

* `amqp.connection.close` - emitted when amqplib connection closes.
  
  Will invoke `_recoverConnectChannel` if `config.autoRecovery` is enabled.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');

bunnyBus.on(BunnyBus.Events.AMQP_CONNECTION_CLOSE, (err) => {});
```

### `BunnyBus.Events.AMQP_CHANNEL_ERROR`

#### event key

* `amqp.channel.error` - emitted when amqplib encounters a corrupted channel state.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.AMQP_CHANNEL_ERROR, (err) => {});
```

### `BunnyBus.Events.AMQP_CHANNEL_CLOSE`

#### event key

* `amqp.channel.close` - emitted when amqplib channel closes.

  Will invoke `_recoverConnectChannel` if `config.autoRecovery` is enabled.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on(BunnyBus.Events.AMQP_CHANNEL_CLOSE, (err) => {});
```

## `SubscriptionManager`

This class manages the state for all subscriptions registered with queues.  A subscription is an association between a queue and handlers associated with it.  A subscription is created when [`subscribe()`](#subscribequeue-handlers-options-callback) is invoked succesfully. The `SubscriptionManager` is also an `EventEmitter` so when actions like `create`, `clear` and `remove` are called, events are emitted so `BunnyBus` can apply the corresponding behavior to meet the desired state.

### `contains(queue, [withConsumerTag])`

Checks if a queue has a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `withConsumerTag` - requires the condition of a subscription to be active.  Defaults to `true`. *[boolean]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.contains('queue1');
```

### `create(queue, handlers, [options])`

Creates a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `handlers` - handlers parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Required**
* `options` - options parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.create('queue1');
```

### `tag(queue, consumerTag)`

Tag a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `consumerTag` - a value returned from the [`consume()`](http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume) method of amqplib.  *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.tag('queue1', 'abcd1234');
```

### `get(queue)`

Returns a clone of the subscription if the queue exists.  Returns `undefined` when it does not exist.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const queue = bunnybus.subscriptions.get('queue1');
```

### `clear(queue)`

Clears a subscription of the `consumerTag`.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.clear('queue1');
```

### `clearAll()`

Clears all subscriptions of the `consumerTag`.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.clearAll();
```

### `remove(queue)`

Removes a subscription from the registrar.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.remove('queue1');
```

### `list()`

Returns a list of cloned subscriptions in the registrar.


```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const subscriptions = bunnybus.subscriptions.list();
```

### `block(queue)`

Adds a queue to the ban list.  Queues in this list live in the desired state.  Once a queue name is added to this list, `BunnyBus` will try to unsubscribe any active consumed queues.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.block('queue1');
```

### `unblock(queue)`

Removes a queue from the ban list.  Queues in this list live in the desired state.  Once a queue name is removed from this list, `BunnyBus` will try to re-subscribe any unactive queues.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.unblock('queue1');
```

## Error Types

All `BunnyBus` errors are extended from the native `Error` class.

- `NoConnectionError` - thrown when no connection exist
- `NoChannelError` - thrown when no channel exist
- `NoRouteKeyError` - thrown when no route key can be found.  Lookup is done against `payload.properties.headers.routeKey`, `options.routeKey`, `message.event` and `payload.fields.routingKey` in that order.
- `SubscriptionExistError` - thrown when `subscribe()` is called and handlers have already been registered against the queue
- `SubscriptionBlockedError` - thrown when `subscribe()` is called and the queue is in a desired state of blocked.  The handlers would still have registered, but it would take an [`unblock()`](#unblockqueue) call to allow for the handlers to continue its subscriptions.
