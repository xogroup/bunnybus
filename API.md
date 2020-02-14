# 4.0.0 API Reference

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [BunnyBus](#bunnybus)
  - [Constructor](#constructor)
    - [`new BunnyBus(config)`](#new-bunnybusconfig)
  - [Getters and Setters](#getters-and-setters)
    - [`config`](#config)
    - [`connections`](#connections)
    - [`channels`](#channels)
    - [`subscriptions`](#subscriptions)
    - [`logger`](#logger)
    - [`connectionString`](#connectionstring)
  - [Methods](#methods)
    - [`async createExchange(name, type, [options])`](#async-createexchangename-type-options)
      - [parameter(s)](#parameters)
    - [`async deleteExchange(name, [options])`](#async-deleteexchangename-options)
      - [parameter(s)](#parameters-1)
    - [`async checkExchange(name)`](#async-checkexchangename)
      - [parameter(s)](#parameters-2)
    - [`async createQueue(name, [options])`](#async-createqueuename-options)
      - [parameter(s)](#parameters-3)
    - [`async deleteQueue(name, [options])`](#async-deletequeuename-options)
      - [parameter(s)](#parameters-4)
    - [`async checkQueue(name)`](#async-checkqueuename)
      - [parameter(s)](#parameters-5)
    - [`async publish(message, [options])`](#async-publishmessage-options)
      - [parameter(s)](#parameters-6)
    - [`async subscribe(queue, handlers, [options])`](#async-subscribequeue-handlers-options)
      - [parameter(s)](#parameters-7)
      - [handlers](#handlers)
      - [`key`](#key)
      - [`handler`](#handler)
    - [`async unsubscribe(queue)`](#async-unsubscribequeue)
      - [parameter(s)](#parameters-8)
    - [`await send(message, queue, [options])`](#await-sendmessage-queue-options)
      - [note(s)](#notes)
      - [parameter(s)](#parameters-9)
    - [`async get(queue, [options])`](#async-getqueue-options)
      - [parameter(s)](#parameters-10)
    - [`async getAll(queue, handler, [options])`](#async-getallqueue-handler-options)
      - [parameter(s)](#parameters-11)
  - [Internal-use Methods](#internal-use-methods)
    - [`_recoverConnectChannel()`](#_recoverconnectchannel)
    - [`_createConnection([callback])`](#_createconnectioncallback)
    - [`_closeConnection([callback])`](#_closeconnectioncallback)
    - [`_createChannel([callback])`](#_createchannelcallback)
    - [`_closeChannel([callback])`](#_closechannelcallback)
- [Events (`EventEmitter`)](#events-eventemitter)
  - [`BunnyBus.LOG_DEBUG_EVENT`](#bunnybuslog_debug_event)
    - [event key](#event-key)
    - [handler parameter(s)](#handler-parameters)
  - [`BunnyBus.LOG_TRACE_EVENT`](#bunnybuslog_trace_event)
    - [event key](#event-key-1)
    - [handler parameter(s)](#handler-parameters-1)
  - [`BunnyBus.LOG_INFO_EVENT`](#bunnybuslog_info_event)
    - [event key](#event-key-2)
    - [handler parameter(s)](#handler-parameters-2)
  - [`BunnyBus.LOG_WARN_EVENT`](#bunnybuslog_warn_event)
    - [event key](#event-key-3)
    - [handler parameter(s)](#handler-parameters-3)
  - [`BunnyBus.LOG_ERROR_EVENT`](#bunnybuslog_error_event)
    - [event key](#event-key-4)
    - [handler parameter(s)](#handler-parameters-4)
  - [`BunnyBus.LOG_FATAL_EVENT`](#bunnybuslog_fatal_event)
    - [event key](#event-key-5)
    - [handler parameter(s)](#handler-parameters-5)
  - [`BunnyBus.PUBLISHED_EVENT`](#bunnybuspublished_event)
    - [event key](#event-key-6)
    - [handler parameter(s)](#handler-parameters-6)
  - [`BunnyBus.SUBSCRIBED_EVENT`](#bunnybussubscribed_event)
    - [event key](#event-key-7)
    - [handler parameter(s)](#handler-parameters-7)
  - [`BunnyBus.UNSUBSCRIBED_EVENT`](#bunnybusunsubscribed_event)
    - [event key](#event-key-8)
    - [handler parameter(s)](#handler-parameters-8)
  - [`BunnyBus.RECOVERING_EVENT`](#bunnybusrecovering_event)
    - [event key](#event-key-9)
  - [`BunnyBus.RECOVERED_EVENT`](#bunnybusrecovered_event)
    - [event key](#event-key-10)
  - [`BunnyBus.AMQP_CONNECTION_ERROR_EVENT`](#bunnybusamqp_connection_error_event)
    - [event key](#event-key-11)
    - [handler parameter(s)](#handler-parameters-9)
  - [`BunnyBus.AMQP_CONNECTION_CLOSE_EVENT`](#bunnybusamqp_connection_close_event)
    - [event key](#event-key-12)
    - [handler parameter(s)](#handler-parameters-10)
  - [`BunnyBus.AMQP_CHANNEL_ERROR_EVENT`](#bunnybusamqp_channel_error_event)
    - [event key](#event-key-13)
    - [handler parameter(s)](#handler-parameters-11)
  - [`BunnyBus.AMQP_CHANNEL_CLOSE_EVENT`](#bunnybusamqp_channel_close_event)
    - [event key](#event-key-14)
    - [handler parameter(s)](#handler-parameters-12)
- [`Connection`](#connection)
  - [Getters and Setters](#getters-and-setters-1)
    - [`name`](#name)
    - [`connectionOptions`](#connectionoptions)
    - [`socketOptions`](#socketoptions)
    - [`lock`](#lock)
      - [`blocked`](#blocked)
      - [`connection`](#connection)
  - [Events](#events)
    - [`ConnectionManager.AMQP_CONNECTION_ERROR_EVENT`](#connectionmanageramqp_connection_error_event)
      - [key value](#key-value)
      - [handler parmaeters](#handler-parmaeters)
    - [`ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT`](#connectionmanageramqp_connection_close_event)
      - [key value](#key-value-1)
      - [handler parmaeters](#handler-parmaeters-1)
    - [`ConnectionManager.AMQP_CONNECTION_BLOCKED_EVENT`](#connectionmanageramqp_connection_blocked_event)
      - [key value](#key-value-2)
      - [handler parmaeters](#handler-parmaeters-2)
    - [`ConnectionManager.AMQP_CONNECTION_UNBLOCKED_EVENT`](#connectionmanageramqp_connection_unblocked_event)
      - [key value](#key-value-3)
      - [handler parmaeters](#handler-parmaeters-3)
    - [`ConnectionManager.CONNECTION_REMOVED`](#connectionmanagerconnection_removed)
      - [key value](#key-value-4)
      - [handler parmaeters](#handler-parmaeters-4)
- [`ConnectionManager`](#connectionmanager)
  - [Methods](#methods-1)
    - [`async create(name, connectionOptions, [socketOptions])`](#async-createname-connectionoptions-socketoptions)
      - [parameter(s)](#parameters-12)
    - [`contains(name)`](#containsname)
      - [parameter(s)](#parameters-13)
    - [`get(name)`](#getname)
      - [parameter(s)](#parameters-14)
    - [`list()`](#list)
    - [`hasConnection(name)`](#hasconnectionname)
      - [parameter(s)](#parameters-15)
    - [`getConnection(name)`](#getconnectionname)
      - [parameter(s)](#parameters-16)
    - [`async remove(name)`](#async-removename)
      - [parameter(s)](#parameters-17)
    - [`async close(name)`](#async-closename)
      - [parameter(s)](#parameters-18)
  - [Events](#events-1)
    - [`ConnectionManager.CONNECTION_REMOVED`](#connectionmanagerconnection_removed-1)
      - [key value](#key-value-5)
      - [handler parmaeters](#handler-parmaeters-5)
- [`Channel`](#channel)
  - [Getters and Setters](#getters-and-setters-2)
    - [`name`](#name-1)
    - [`connectionContext`](#connectioncontext)
    - [`channelOptions`](#channeloptions)
    - [`lock`](#lock-1)
      - [`channel`](#channel)
  - [Events](#events-2)
    - [`ChannelManager.AMQP_CHANNEL_ERROR_EVENT`](#channelmanageramqp_channel_error_event)
      - [key value](#key-value-6)
      - [handler parmaeters](#handler-parmaeters-6)
    - [`ChannelManager.AMQP_CHANNEL_CLOSE_EVENT`](#channelmanageramqp_channel_close_event)
      - [key value](#key-value-7)
      - [handler parmaeters](#handler-parmaeters-7)
    - [`ChannelManager.AMQP_CHANNEL_RETURN_EVENT`](#channelmanageramqp_channel_return_event)
      - [key value](#key-value-8)
      - [handler parmaeters](#handler-parmaeters-8)
    - [`ChannelManager.AMQP_CHANNEL_DRAIN_EVENT`](#channelmanageramqp_channel_drain_event)
      - [key value](#key-value-9)
      - [handler parmaeters](#handler-parmaeters-9)
    - [`ConnectionManager.CHANNEL_REMOVED`](#connectionmanagerchannel_removed)
      - [key value](#key-value-10)
      - [handler parmaeters](#handler-parmaeters-10)
- [`ChannelManager`](#channelmanager)
  - [Methods](#methods-2)
    - [`async create(name, [queue = null], connectionContext, channelOptions)`](#async-createname-queue--null-connectioncontext-channeloptions)
      - [parameter(s)](#parameters-19)
    - [`contains(name)`](#containsname-1)
      - [parameter(s)](#parameters-20)
    - [`get(name)`](#getname-1)
      - [parameter(s)](#parameters-21)
    - [`list()`](#list-1)
    - [`hasChannel(name)`](#haschannelname)
      - [parameter(s)](#parameters-22)
    - [`getChannel(name)`](#getchannelname)
      - [parameter(s)](#parameters-23)
    - [`async remove(name)`](#async-removename-1)
      - [parameter(s)](#parameters-24)
    - [`async close(name)`](#async-closename-1)
      - [parameter(s)](#parameters-25)
  - [Events](#events-3)
    - [`ChannelManager.CHANNEL_REMOVED`](#channelmanagerchannel_removed)
      - [key value](#key-value-11)
      - [handler parmaeters](#handler-parmaeters-11)
- [`SubscriptionManager`](#subscriptionmanager)
  - [Methods](#methods-3)
    - [`contains(queue, [withConsumerTag])`](#containsqueue-withconsumertag)
    - [`create(queue, handlers, [options])`](#createqueue-handlers-options)
    - [`tag(queue, consumerTag)`](#tagqueue-consumertag)
    - [`get(queue)`](#getqueue)
    - [`clear(queue)`](#clearqueue)
    - [`clearAll()`](#clearall)
    - [`remove(queue)`](#removequeue)
    - [`list()`](#list-2)
    - [`block(queue)`](#blockqueue)
    - [`unblock(queue)`](#unblockqueue)
  - [Events](#events-4)
    - [`SubscriptionManager.CREATED_EVENT`](#subscriptionmanagercreated_event)
      - [key value](#key-value-12)
      - [handler parmaeters](#handler-parmaeters-12)
    - [`SubscriptionManager.TAGGED_EVENT`](#subscriptionmanagertagged_event)
      - [key value](#key-value-13)
      - [handler parmaeters](#handler-parmaeters-13)
    - [`SubscriptionManager.CLEARED_EVENT`](#subscriptionmanagercleared_event)
      - [key value](#key-value-14)
      - [handler parmaeters](#handler-parmaeters-14)
    - [`SubscriptionManager.REMOVED_EVENT`](#subscriptionmanagerremoved_event)
      - [key value](#key-value-15)
      - [handler parmaeters](#handler-parmaeters-15)
    - [`SubscriptionManager.BLOCKED_EVENT`](#subscriptionmanagerblocked_event)
      - [key value](#key-value-16)
      - [handler parmaeters](#handler-parmaeters-16)
    - [`SubscriptionManager.UNBLOCKED_EVENT`](#subscriptionmanagerunblocked_event)
      - [key value](#key-value-17)
      - [handler parmaeters](#handler-parmaeters-17)
- [Error Types](#error-types)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## BunnyBus

`BunnyBus` is a class that instantiates into a singleton.  It hosts all features for communicating with RabbitMQ to provide an easy to use enterprise bus facade.

**Note About Versioning**

A note regarding versioning:  `BunnyBus` attaches the version value found in its `package.json` file to all messages that are sent.  Optionally through the `validateVersion` flag, any messages that are picked up from a subscribed queue which do not match the major semver will be rejected to the error queue.  As an example, message sent from BunnyBus version `1.2.3` will only be accepted from other `BunnyBus` clients with semver range of `1.x.x`.

### Constructor

#### `new BunnyBus(config)`

Creates a new singleton instance of `bunnybus`. Accepts a configuration parameter. See [`config`](#config) for allowed options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus({ hostname : 'red-bee.cloudamqp.com' });

//do work;
```

### Getters and Setters

#### `config`

Setter and Getter for singleton configuration. Accepts the following optional properties:

 * `protocol` - value for creating a secure connection.  Used in the connection string.  Defaults to `amqp`. *[string]* **Optional**
 * `username` - value of the username.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `password` - value of the password.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `hostname` - value of the server address.  Just the host portion of the URI.  eg `red-bee.cloudamqp.com` or `rabbitbox` or `56.23.0.123`.  Used in the connection string.  Defaults to `127.0.0.1`. *[string]* **Optional**
 * `port` - value of the port for client connections.  Used in the conneciton string.  Defaults to `5672`. *[number]* **Optional**
 * `vhost` - value of the virtual host the user connects to.  Used in the connection string.  Defaults to `%2f`. *[string]* **Optional**
 * `heartbeat` -  value negotiated between client and server on when the TCP tunnel is considered dead.  Unit is a measurement of milliseconds.  Used in the connection string.  Defaults to `2000`. *[number]* **Optional**
 * `timeout` - value for timing out any network operations.  Unit is a measurement of milliseconds.  Defaults to `2000`. *[number]* **Optional**
 * `globalExchange` - value of the exchange to transact through for message publishing.  This is the default used when one is not provided within the `options` for any `BunnyBus` methods that supports one transactionally.  Defaults to `default-exchange`. *[string]* **Optional**
 * `prefetch` - value of the maximum number of unacknowledged messages allowable in a channel.  Defaults to `5`. *[number]* **Optional**
 * `maxRetryCount` - maximum amount of attempts a message can be requeued.  This is the default used when one is not provided within the `options` for any `BunnyBus` methods that supports one transactionally. Defaults to `10`. *[number]* **Optional**
 * `validatePublisher` - flag to dictate if the publishing source for messages being consumed must be `bunnyBus`.  This is a safe guard to prevent unexpected message sources from entering the subscribing realm. A value of `bunnyBus` is stamped as a header property on the message during `publish()`.  The `subscribe()` method will use the same value for authentication.  Consumers detecting mismatched publishers will auto reject the message into an error queue.  Defaults to `false`. *[boolean]* **Optional**
 * `validateVersion` - flag to dictate if major semver should be matched as part of the message subscription valiation.  This is a safe guard to prevent mismatched `bunnyBus` drivers from pub/sub to each other.  Consumers detecting mismatched major values will auto reject the message into an error queue.  In order for this layer of validation to occur, `validatePublisher` must be allowed because the version value is set against the `bunnyBus` header.   Defaults to `false`. *[boolean]* **Optional**
 * `disableQueueBind` - flag to dictate if automatic queue binding should be turned on/off as part of the consume setup process.  Defaults to `false`.  *[boolean]* **Optional**
 * `rejectUnroutedMessages` - flag to direct messages that were unroutable to provided handlers to either be automatically rejected or acknowledged off the queue.  The default is silent acknowledgements.  Defaults to `false`.  *[boolean]* **Optional**

Note that updates in the options directed at changing connection string will not take affect immediately.  [`_closeConnection()`](#_closeConnectioncallback) needs to be called manually to invoke a new connection with new settings.

  ```javascript
  const BunnyBus = require('bunnybus');
  const bunnyBus = new BunnyBus();

  //deferred configuration
  bunnyBus.config = { hostname : 'red-bee.cloudamqp.com'};

  //do work
  ```

#### `connections`

Getter for connections.  A reference to the [Connection Manager](#connectionmanager).

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.connections.get('defaultConnection'));

// output : { name, connectionOptions, socketOptions, lock, blocked, connection }
```

#### `channels`

Getter for channels.  A reference to the [Channel Manager](#channelmanager).

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.channels.get('channelForQueue1'));

// output : { name, queue, connectionContext, channelOptions, lock, channel }
```

#### `subscriptions`

Getter for subscriptions.  A reference to the [Subscription Manager](#subscriptionmanager).

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.subscriptions.get('queue'));

//output : { queue : 'queue1', consumerTag : 'abc123', handlers : {}, options : {}}
```

#### `logger`

Setter and Getter for logger.  By default, `BunnyBus` will instantiate and set a logger using the `EventEmitter`.  When a custom logger is set, `BunnyBus` will **no** longer emit log messages through the `EventEmitter`.  The Setter will also validate the contract of the logger to ensure the following keys exist [`debug`, `info`, `warn`, `error`, `fatal`] and are of type `Function`.  When validation fails, an error will be thrown.

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

#### `connectionString`

Getter for AMQP connection string.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.connectionString);
//output : amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000
```

### Methods

#### `async createExchange(name, type, [options])`

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

#### `async deleteExchange(name, [options])`

Delete an exchange.

##### parameter(s)

  - `name` - name of the exchange to be deleted. *[string]* **Required**
  - `options` - optional settings. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteExchange) are proxed through to amqplib `deleteExchange`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.deleteExchange('default-exchange');
```

#### `async checkExchange(name)`

Checks if an exchange exists.  The channel closes when the exchange does not exist.

##### parameter(s)

  - `name` - name of the exchange to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkExchange('default-exchange');
```

#### `async createQueue(name, [options])`

Creates a queue.

##### parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createQueue('queue1');
```

#### `async deleteQueue(name, [options])`

Delete a queue.

##### parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue) are proxied through to amqplib `deleteQueue`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

async bunnyBus.deleteQueue('queue1');
```

#### `async checkQueue(name)`

Checks if a queue exists.  The channel closes when the queue does not exist.

##### parameter(s)

  - `name` - name of the queue to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkQueue('queue1');
```

#### `async publish(message, [options])`

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

#### `async subscribe(queue, handlers, [options])`

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
    - `disableQueueBind` - flag for disabling automatic queue binding.  More info can be found in [config](#config).  Defaults to one provided in the [config](#config).  *[boolean]* **Optional**
    - `rejectUnroutedMessages` - flag for enabling rejection for unroutable messages.  More info can be found in [config](#config).  Defaults to one provided in the [config](#config).  *[boolean]* 
    - `meta` - allows for meta data regarding the payload to be returned.  Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.  Turning this on will adjust the handler to be a `Function` as `(message, meta, [ack, [reject, [requeue]]]) => {}`. *[boolean]* **Optional**

##### handlers

##### `key`

A `key` is the routeKey in RabbitMQ terminology.  `BunnyBus` specifically leverages [topic exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html) to route a message from the exchange to any number of queues that are subscribed.  The keys are normally dot notated and wild cards of `*` (can substitute for exactly one word) and `#` (can substitute for zero or more words).  Keys can look like `vineyard.wine-produced`, `vineyard.wine-sold`, `vineyard.*`, `vineyard.#` and etc...  A bug was found during this implementation regarding expected behavior of wildcard syntax [here](https://github.com/rabbitmq/rabbitmq-server/issues/1383)

##### `handler`

A `handler` is an asynchronous function which contains the following arity.  Order matters.
  - `message` is what was received from the bus.  The message does represent the RabbitMQ `'payload.content` buffer.  The original source of this object is from `payload.content`.
  - `meta` is only available when `options.meta` is set to `true`.  This object will contain all payload related meta information like `payload.properties.headers`. Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.
  - `async ack([option)` is a function for acknowledging the message off the bus.
    - `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
  - `async reject([option)` is a function for rejecting the message off the bus to a predefined error queue.  The error queue is named by default `<your queue name>_error`.  It will also short circuit to `error_bus` when defaults can't be found.
    - `option` - An object with a property of `reason` to be supplied. *[object]* **Optional**
  - `async requeue()` is a function for requeuing the message back to the back of the queue.  This is feature circumvents Rabbit's `nack` RPC.  `nack` natively requeues but pushes the message to the front of the queue.

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

#### `async unsubscribe(queue)`

Unsubscribe active handlers that are listening to a queue.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.unsubscribe('queue1');
```

#### `await send(message, queue, [options])`

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

#### `async get(queue, [options])`

Pop a message directly off a queue.  The payload returned is the RabbitMQ `payload` with `payload.properties` and `payload.content` in its original form.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const payload = await bunnyBus.get('queue1');
```

#### `async getAll(queue, handler, [options])`

Pop all messages directly off of a queue until there are no more.  Handler is called for each message that is popped.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `handler` - a handler reflects an `AsyncFunction` as `(message, [meta, [ack]]) => {}`. *[AsyncFunction]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `get` - [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**
    - `meta` - allows for meta data regarding the payload to be returned.  Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `meta.headers` object.  Turning this on will adjust the handler to be a `Function` as `(message, meta, [ack]) => {}`.  *[boolean]* **Optional**

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

Auto retry mechanism when to restore either a connection or channel when it gets corrupted.  The retry mechanism will attempt 240 times every 15 seconds.  When a connection can not be restored, `process.exit(1)` will be called.  This is invoked internally through error handlers.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

// something bad happened

bunnyBus._recoverConnectChannel();
```

#### `_createConnection([callback])`

Create a connection from settings defined through custom or default configurations.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._createConnection((err) => {});

// promise api
bunnyBus._createConnection()
    .then()
    .catch((err) => {});
```

#### `_closeConnection([callback])`

Closes an opened connection if one exists.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._closeConnection((err) => {});

// promise api
bunnyBus._closeConnection()
    .then()
    .catch((err) => {});
```

#### `_createChannel([callback])`

Create a channel from an existing connection.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._createChannel((err) => {});

// promise api
bunnyBus._createChannel()
    .then()
    .catch((err) => {});
```

#### `_closeChannel([callback])`

Closes an channel if one exists.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._closeChannel((err) => {});

// promise api
bunnyBus._closeChannel()
    .then()
    .catch((err) => {});
```

## Events (`EventEmitter`)

`BunnyBus` extends `EventEmitter` for emitting logs and system specific events.  Subscription to these events is optional.  `BunnyBus` class also exposes static Getter properties for the name of these public events.

### `BunnyBus.LOG_DEBUG_EVENT`

#### event key

* `log.debug` - debug level logging message.

#### handler parameter(s)

* `message` - debug message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_DEBUG_EVENT', pino.debug);
bunnyBus.on('log.debug', pino.debug);
```

### `BunnyBus.LOG_TRACE_EVENT`

#### event key

* `log.trace` - trace level logging message.

#### handler parameter(s)

* `message` - debug message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_TRACE_EVENT', pino.trace);
bunnyBus.on('log.trace', pino.trace);
```

### `BunnyBus.LOG_INFO_EVENT`

#### event key

* `log.info` - info level logging message.

#### handler parameter(s)

* `message` - info message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_INFO_EVENT', pino.info);
bunnyBus.on('log.info', pino.info);
```

### `BunnyBus.LOG_WARN_EVENT`

#### event key

* `log.warn` - warn level logging message.

#### handler parameter(s)

* `message` - warn message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_WARN_EVENT', pino.warn);
bunnyBus.on('log.warn', pino.warn);
```

### `BunnyBus.LOG_ERROR_EVENT`

#### event key

* `log.error` - error level logging message.

#### handler parameter(s)

* `message` - error message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_ERROR_EVENT', pino.error);
bunnyBus.on('log.error', pino.error);
```

### `BunnyBus.LOG_FATAL_EVENT`

#### event key

* `log.fatal` - fatal level logging message.

#### handler parameter(s)

* `message` - fatal message sent. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_FATAL_EVENT', pino.fatal);
bunnyBus.on('log.fatal', pino.fatal);
```

### `BunnyBus.PUBLISHED_EVENT`

#### event key

* `bunnybus.published` - emitted when [`publish()`](#publishmessage-options-callback) is successfully called.

#### handler parameter(s)

* `message` - original payload published. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.PUBLISHED_EVENT', (message) => {

    //do work
});
```

### `BunnyBus.SUBSCRIBED_EVENT`

#### event key

* `bunnybus.subscribed` - emitted when [`subcribe()`](#subscribequeue-handlers-options-callback) is successfully called.

#### handler parameter(s)

* `queue` - name of queue subcribed for. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.SUBSCRIBED_EVENT', (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

### `BunnyBus.UNSUBSCRIBED_EVENT`

#### event key

* `bunnybus.unsubscribed` - emitted when [`unsubcribe()`](#unsubscribequeue-callback) is successfully called.

#### handler parameter(s)

* `queue` - name of queue unsubscribed from. *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.UNSUBSCRIBED_EVENT', (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

### `BunnyBus.RECOVERING_EVENT`

#### event key

* `bunnybus.recovering` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is first invoked.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERING_EVENT', () => {

    // do work to handle the case when a connection or channel is having a failure
});
```

### `BunnyBus.RECOVERED_EVENT`

#### event key

* `bunnybus.recovered` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is successfully restores connections and channel.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERED_EVENT', () => {

    // do work to handle the case when a connection or channel is restored
});
```

### `BunnyBus.AMQP_CONNECTION_ERROR_EVENT`

#### event key

* `amqp.connection.error` - emitted when amqplib encounters a corrupted connection state.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.AMQP_CONNECTION_ERROR_EVENT', (err) => {

    // do work
});
```

### `BunnyBus.AMQP_CONNECTION_CLOSE_EVENT`

#### event key

* `amqp.connection.close` - emitted when amqplib connection closes.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.AMQP_CONNECTION_CLOSE_EVENT', (err) => {

    // do work
});
```

### `BunnyBus.AMQP_CHANNEL_ERROR_EVENT`

#### event key

* `amqp.channel.error` - emitted when amqplib encounters a corrupted channel state.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.AMQP_CHANNEL_ERROR_EVENT', (err) => {

    // do work
});
```

### `BunnyBus.AMQP_CHANNEL_CLOSE_EVENT`

#### event key

* `amqp.channel.close` - emitted when amqplib channel closes.

#### handler parameter(s)

* `err` - error from amqplib. *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.AMQP_CHANNEL_CLOSE_EVENT', (err) => {

    // do work
});
```

## `Connection`

This class contains the actual `amqplib` connection objet along with contextual properties like name and options that were used to create the connection.  The `Connection` is also an `EventEmitter` to support event proxying from the underlying `amqplib` connection object.

### Getters and Setters

#### `name` 

Getter for connection name.  Value used for futher operation and identification of a connection.

#### `connectionOptions`

Getter for connection options supplied to `amqplib.connect()` interface.  See [`config`](#config) for allowed options.  Only relevant subset is used.

#### `socketOptions`

Getter for socket / tls options supplied to `amqplib.connect()` interface that is then proxied to the underling `net` and `tls` libraries.

#### `lock`

Setter and Getter for mutual-exclusion lock for the instantiated object.  Used to ensure operations for connection creation is done single file sequentially.

##### `blocked`

Setter and Getter for connection block signaling from RabbitMQ for cases of server resource starvation.

##### `connection`

Setter and Getter for the `amqplib` connection object.

### Events

#### `ConnectionManager.AMQP_CONNECTION_ERROR_EVENT`

##### key value

* `amqp.connection.error` - emitted when the `amqplib` connection errors.

##### handler parmaeters

* `err` - a error object of type `Error` *[object]*
* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.AMQP_CONNECTION_ERROR_EVENT, (err, context) => {

    console.error(err);
    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

#### `ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT`

##### key value

* `amqp.connection.close` - emitted when the `amqplib` connection closes.

##### handler parmaeters

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.AMQP_CONNECTION_CLOSE_EVENT, (context) => {

    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

#### `ConnectionManager.AMQP_CONNECTION_BLOCKED_EVENT`

##### key value

* `amqp.connection.blocked` - emitted when the `amqplib` connection is blocked to signal no more send/publish operations should be invoked.

##### handler parmaeters

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.AMQP_CONNECTION_BLOCKED_EVENT, (context) => {

    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

#### `ConnectionManager.AMQP_CONNECTION_UNBLOCKED_EVENT`

##### key value

* `amqp.connection.unblocked` - emitted when the `amqplib` connection is unblocked.

##### handler parmaeters

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.AMQP_CONNECTION_UNBLOCKED_EVENT, (context) => {

    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

#### `ConnectionManager.CONNECTION_REMOVED`

##### key value

* `connectionManager.removed` - emitted when the connection context is removed by [`close()`](#async-closename).

##### handler parmaeters

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.CONNECTION_REMOVED, (context) => {

    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

## `ConnectionManager`

This class manages the collection of all connections created within BunnyBus.  The `ConnectionManager` is also an `EventEmitter` so when actions like `remove` is called, events are emitted.

### Methods

#### `async create(name, connectionOptions, [socketOptions])`

Creates an `amqplib` connection.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**
* `connectionOptions` - options used to create the `amqplib` connection.  See [`config`](#config) for allowed options.  Only relevant subset is used.  *[object]* **Required**
* `socketOptions` - options used to configure the underlying socket/tls behavior.  Refer to [`net`](https://nodejs.org/api/net.html) / [`tls'](https://nodejs.org/api/tls.html) modules for configuration values.  *[object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const connectionContext = await bunnybus.connections.create('defaultConnection', { hostname, username, password });
```

#### `contains(name)`

Checks if a connection context exist with the specified name.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const exist = bunnybus.connections.contains('defaultConnection');
// exist : boolean
```

#### `get(name)`

Retrieves a connection context with the specified name.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const connectionContext = bunnybus.connections.get('defaultConnection');
```

#### `list()`

Returns all connections registered that are in any state of operability.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const connectionContexts = bunnybus.connections.list();
```

#### `hasConnection(name)`

Checks if an `amqplib` connection exist with the specified name.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const exist = bunnybus.connections.hasConnection('defaultConnection');
// exist : boolean
```

#### `getConnection(name)`

Retrieves an `amqplib` connection with the specified name.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const connection = bunnybus.connections.getConnection('defaultConnection');
// connection : amqplib connecton object
```

#### `async remove(name)`

Removes the connection context with the specified name from the [`ConnectionManager`](#connectionmanager).  Closes the underlying connection.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnybus.connections.remove('defaultConnection');
```

#### `async close(name)`

Closes the `amqplib` connection the specified name.

##### parameter(s)

* `name` - name of the connection. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnybus.connections.close('defaultConnection');
```

### Events

#### `ConnectionManager.CONNECTION_REMOVED`

##### key value

* `connectionManager.removed` - emitted when the connection context is removed by [`close()`](#async-closename).

##### handler parmaeters

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.on(ConnectionManager.CONNECTION_REMOVED, (context) => {

    console.log(context);
    // output : { name, connectionOptions, socketOptions, lock, blocked, connection }
});
```

## `Channel`

This class contains the actual `amqplib` channel object along with contextual properties like name, connection context and otions that were used to create the channel.  The `Channel` is also an `EventEmitter` to support event proxying from the underlying `amqplib` channel object.

### Getters and Setters

#### `name` 

Getter for channel name.  Value used for futher operation and identification of a channel.

#### `connectionContext`

Getter for connection context.  The connection context contains the `amqplib` connection object that is used to create a channel from.

#### `channelOptions`

Getter for channel options supplied to `amqplib.createConfirmChannel()` interface.  See [`config`](#config) for allowed options.  Only relevant subset is used like `prefetch`

#### `lock`

Setter and Getter for mutual-exclusion lock for the instantiated object.  Used to ensure operations for channel creation is done single file sequentially.

##### `channel`

Setter and Getter for the `amqplib` channel object.

### Events

#### `ChannelManager.AMQP_CHANNEL_ERROR_EVENT`

##### key value

* `amqp.channel.error` - emitted when the `amqplib` channel errors.

##### handler parmaeters

* `err` - a error object of type `Error` *[object]*
* `channelContext` - channel context that is the [`Channel`](#channel) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.get('channelName').on(ChannelManager.AMQP_CHANNEL_ERROR_EVENT, (err, context) => {

    console.error(err);
    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

#### `ChannelManager.AMQP_CHANNEL_CLOSE_EVENT`

##### key value

* `amqp.channel.close` - emitted when the `amqplib` channel closes.

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.get('channelName').on(ChannelManager.AMQP_CHANNEL_CLOSE_EVENT, (context) => {

    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

#### `ChannelManager.AMQP_CHANNEL_RETURN_EVENT`

##### key value

* `amqp.channel.return` - emitted when the `amqplib` channel returns a message that had no route recipient when published to an exchange.

##### handler parmaeters

* `payload` - The message that was sent with no matching route recipient. *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.get('channelName').on(ChannelManager.AMQP_CHANNEL_RETURN_EVENT, (payload) => {

    console.log(payload);
    // output : { properties, content }
});
```

#### `ChannelManager.AMQP_CHANNEL_DRAIN_EVENT`

##### key value

* `amqp.channel.drain` - emitted when the `amqplib` channel signals resource capacity recovery allowing for more messages to be sent.

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[object]* 

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.get('channelName').on(ChannelManager.AMQP_CHANNEL_DRAIN_EVENT, (context) => {

    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

#### `ConnectionManager.CHANNEL_REMOVED`

##### key value

* `channelManager.removed` - emitted when the channel context is removed by [`close()`](#async-closename).

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[object]* 

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ConnectionManager.CHANNEL_REMOVED, (context) => {

    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

## `ChannelManager`

This class manages the collection of all connections created within BunnyBus.  The `ConnectionManager` is also an `EventEmitter` so when actions like `remove` is called, events are emitted.

### Methods

#### `async create(name, [queue = null], connectionContext, channelOptions)`

Creates an `amqplib` channel.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**
* `queue` - name of the queue the channel is supporting.  Used primarily as a label to use for filtering and identification.  Defaults to `null`. *[string]* **Optional**
* `connectionContext` - the connection context to use for instantiation of a channel from.  *[object]* **Required**
* `channelOptions` - options used to create the `amqplib` connection.  See [`config`](#config) for allowed options.  Only relevant subset is used like `prefetch`  *[object]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const channelContext = await bunnybus.channels.create('channelForQueue1', 'queue1', connectionContext, { prefetch });
```

#### `contains(name)`

Checks if a channel context exist with the specified name.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const exist = bunnybus.channels.contains('channelForQueue1');
// exist : boolean
```

#### `get(name)`

Retrieves a channel context with the specified name.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const channelContext = bunnybus.channels.get('channelForQueue1');
```

#### `list()`

Returns all channels registered that are in any state of operability.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const channelContexts = bunnybus.channels.list();
```

#### `hasChannel(name)`

Checks if an `amqplib` channel exist with the specified name.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const exist = bunnybus.channels.hasChannel('channelForQueue1');
// exist : boolean
```

#### `getChannel(name)`

Retrieves an `amqplib` channel with the specified name.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const channel = bunnybus.channels.getConnection('channelForQueue1');
// connection : amqplib channel object
```

#### `async remove(name)`

Removes the channel context with the specified name from the [`ChannelManager`](#channelmananger).  Closes the underlying channel.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnybus.channels.remove('channelForQueue1');
```

#### `async close(name)`

Closes the `amqplib` channel the specified name.

##### parameter(s)

* `name` - name of the channel. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnybus.connections.close('channelForQueue1');
```

### Events

#### `ChannelManager.CHANNEL_REMOVED`

##### key value

* `channelManager.removed` - emitted when the channel context is removed by [`remove()`](#async-removename).

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[object]* 

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.on(ChannelManager.AMQP_CHANNEL_DRAIN_EVENT, (context) => {

    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

## `SubscriptionManager`

This class manages the state for all subscriptions registered with queues.  A subscription is an association between a queue and handlers associated with it.  A subscription is created when [`subscribe()`](#subscribequeue-handlers-options-callback) is invoked succesfully. The `SubscriptionManager` is also an `EventEmitter` so when actions like `create`, `clear` and `remove` are called, events are emitted so `BunnyBus` can apply the corresponding behavior to meet the desired state.

### Methods

#### `contains(queue, [withConsumerTag])`

Checks if a queue has a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `withConsumerTag` - requires the condition of a subscription to be active.  Defaults to `true`. *[boolean]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.contains('queue1');
```

#### `create(queue, handlers, [options])`

Creates a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `handlers` - handlers parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Required**
* `options` - options parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.create('queue1');
}
```

#### `tag(queue, consumerTag)`

Tag a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `consumerTag` - a value returned from the [`consume()`](http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume) method of amqplib.  *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.tag('queue1', 'abcd1234');
}
```

#### `get(queue)`

Returns a clone of the subscription if the queue exists.  Returns `undefined` when it does not exist.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.get('queue1');
}
```

#### `clear(queue)`

Clears a subscription of the `consumerTag`.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.clear('queue1');
}
```

#### `clearAll()`

Clears all subscriptions of the `consumerTag`.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.clearAll();
}
```

#### `remove(queue)`

Removes a subscription from the registrar.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.remove('queue1');
}
```

#### `list()`

Returns a list of cloned subscriptions in the registrar.


```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.list();

//output : [ subscriptions ]
}
```

#### `block(queue)`

Adds a queue to the ban list.  Queues in this list live in the desired state.  Once a queue name is added to this list, `BunnyBus` will try to unsubscribe any active consumed queues.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.block('queue1');
}
```

#### `unblock(queue)`

Removes a queue from the ban list.  Queues in this list live in the desired state.  Once a queue name is removed from this list, `BunnyBus` will try to re-subscribe any unactive queues.

* `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.unblock('queue1');
}
```

### Events

#### `SubscriptionManager.CREATED_EVENT`

##### key value

* `subscription.created` - emitted when [`create()`](#createqueue-handlers-options) is succesfully called.

##### handler parmaeters

* `subscription` - subscription context that was created *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.CREATED_EVENT, (context) => {

    console.log(context);
    // output : { queue, handlers, options, consumerTag }
});
```

#### `SubscriptionManager.TAGGED_EVENT`

##### key value

* `subscription.tagged` - emitted when [`tag()`](#tagqueue-consumertag) is succesfully called.

##### handler parmaeters

* `subscription` - subscription context that was tagged *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.TAGGED_EVENT, (context) => {

    console.log(context);
    // output : { queue, handlers, options, consumerTag }
});
```

#### `SubscriptionManager.CLEARED_EVENT`

##### key value

* `subscription.cleared` - emitted when [`clear()`](#clearqueue) is succesfully called.

##### handler parmaeters

* `subscription` - subscription context that had its consumer tag removed *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.CLEARED_EVENT, (context) => {

    console.log(context);
    // output : { queue, handlers, options, consumerTag }
});
```

#### `SubscriptionManager.REMOVED_EVENT`

##### key value

* `subscription.removed` - emitted when [`remove()`](#removequeue) is succesfully called.

##### handler parmaeters

* `subscription` - subscription context that was removed *[object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.REMOVED_EVENT, (context) => {

    console.log(context);
    // output : { queue, handlers, options, consumerTag }
});
```

#### `SubscriptionManager.BLOCKED_EVENT`

##### key value

* `subscription.blocked` - emitted when [`block()`](#blockqueue) is succesfully called.

##### handler parmaeters

* `queue` - queue that was added to the block list *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.BLOCKED_EVENT, (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

#### `SubscriptionManager.UNBLOCKED_EVENT`

##### key value

* `subscription.unblocked` - emitted when [`unblock()`](#unblockqueue) is succesfully called.

##### handler parmaeters

* `queue` - queue that was removed from the block list *[string]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.subscriptions.on(SubscriptionMananger.UNBLOCKED_EVENT, (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

## Error Types

All `BunnyBus` errors are extended from the native `Error` class.

- `IncompatibleLoggerError` - thrown when the logger interface contract is not met when `instance.logger` is set.
- `NoConnectionError` - thrown when no connection exist
- `NoChannelError` - thrown when no channel exist
- `NoRouteKeyError` - thrown when no route key can be found.  Lookup is done against `payload.properties.headers.routeKey`, `options.routeKey`, `message.event` and `payload.fields.routingKey` in that order.
- `SubscriptionExistError` - thrown when `subscribe()` is called and handlers have already been registered against the queue
- `SubscriptionBlockedError` - thrown when `subscribe()` is called and the queue is in a desired state of blocked.  The handlers would still have registered, but it would take an [`unblock()`](#unblockqueue) call to allow for the handlers to continue its subscriptions.
