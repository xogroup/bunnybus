# 4.x API Reference

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [BunnyBus](#bunnybus)
  - [Constructor](#constructor)
    - [`new BunnyBus([config])`](#new-bunnybusconfig)
  - [Getters and Setters](#getters-and-setters)
    - [`config`](#config)
    - [`connections`](#connections)
    - [`channels`](#channels)
    - [`httpClients`](#httpclients)
    - [`subscriptions`](#subscriptions)
    - [`logger`](#logger)
    - [`connectionString`](#connectionstring)
    - [`healthy`](#healthy)
  - [Static Methods](#static-methods)
    - [`Singleton([config])`](#singletonconfig)
  - [Methods](#methods)
    - [`async createExchange({name, type, [options]})`](#async-createexchangename-type-options)
      - [parameter(s)](#parameters)
    - [`async deleteExchange({name, [options]})`](#async-deleteexchangename-options)
      - [parameter(s)](#parameters-1)
    - [`async checkExchange({name})`](#async-checkexchangename)
      - [parameter(s)](#parameters-2)
    - [`async createQueue({name, [options]})`](#async-createqueuename-options)
      - [parameter(s)](#parameters-3)
    - [`async deleteQueue(name, [options])`](#async-deletequeuename-options)
      - [parameter(s)](#parameters-4)
    - [`async checkQueue({name})`](#async-checkqueuename)
      - [parameter(s)](#parameters-5)
    - [`async purgeQueue({name})`](#async-purgequeuename)
      - [parameter(s)](#parameters-6)
    - [`async publish({message, [options]})`](#async-publishmessage-options)
      - [parameter(s)](#parameters-7)
    - [`async subscribe({queue, handlers, [options]})`](#async-subscribequeue-handlers-options)
      - [parameter(s)](#parameters-8)
      - [handlers](#handlers)
      - [`key`](#key)
      - [`handler`](#handler)
    - [`async resubscribe({queue})`](#async-resubscribequeue)
      - [parameter(s)](#parameters-9)
    - [`async unsubscribe({queue})`](#async-unsubscribequeue)
      - [parameter(s)](#parameters-10)
    - [`await send({message, queue, [options]})`](#await-sendmessage-queue-options)
      - [note(s)](#notes)
      - [parameter(s)](#parameters-11)
    - [`async get({queue, [options]})`](#async-getqueue-options)
      - [parameter(s)](#parameters-12)
    - [`async getAll({queue, handler, [options]})`](#async-getallqueue-handler-options)
      - [parameter(s)](#parameters-13)
    - [`async stop()`](#async-stop)
  - [Internal-use Methods](#internal-use-methods)
    - [`async _autoBuildChannelContext({channelName, [queue = null]})`](#async-_autobuildchannelcontextchannelname-queue--null)
      - [`parameter(s)`](#parameters)
    - [`async _recoverConnection()`](#async-_recoverconnection)
    - [`async _recoverChannel({channelName})`](#async-_recoverchannelchannelname)
    - [`async _ack({payload, channelName}, [options]})`](#async-_ackpayload-channelname-options)
      - [`parameter(s)`](#parameters-1)
    - [`async _requeue({payload, channelName, queue}, [options])`](#async-_requeuepayload-channelname-queue-options)
      - [`parameter(s)`](#parameters-2)
    - [`async _reject({payload, channelName, [errorQueue]}, [options])`](#async-_rejectpayload-channelname-errorqueue-options)
      - [`parameter(s)`](#parameters-3)
  - [Events](#events)
  - [`BunnyBus.LOG_DEBUG_EVENT`](#bunnybuslog_debug_event)
    - [event key](#event-key)
    - [handler parameter(s)](#handler-parameters)
  - [`BunnyBus.LOG_INFO_EVENT`](#bunnybuslog_info_event)
    - [event key](#event-key-1)
    - [handler parameter(s)](#handler-parameters-1)
  - [`BunnyBus.LOG_WARN_EVENT`](#bunnybuslog_warn_event)
    - [event key](#event-key-2)
    - [handler parameter(s)](#handler-parameters-2)
  - [`BunnyBus.LOG_ERROR_EVENT`](#bunnybuslog_error_event)
    - [event key](#event-key-3)
    - [handler parameter(s)](#handler-parameters-3)
  - [`BunnyBus.LOG_FATAL_EVENT`](#bunnybuslog_fatal_event)
    - [event key](#event-key-4)
    - [handler parameter(s)](#handler-parameters-4)
  - [`BunnyBus.PUBLISHED_EVENT`](#bunnybuspublished_event)
    - [event key](#event-key-5)
    - [handler parameter(s)](#handler-parameters-5)
  - [`BunnyBus.MESSAGE_DISPATCHED_EVENT`](#bunnybusmessage_dispatched_event)
    - [event key](#event-key-6)
    - [handler parameter(s)](#handler-parameters-6)
  - [`BunnyBus.MESSAGE_ACKED_EVENT`](#bunnybusmessage_acked_event)
    - [event key](#event-key-7)
    - [handler parameter(s)](#handler-parameters-7)
  - [`BunnyBus.MESSAGE_REQUEUED_EVENT`](#bunnybusmessage_requeued_event)
    - [event key](#event-key-8)
    - [handler parameter(s)](#handler-parameters-8)
  - [`BunnyBus.MESSAGE_REJECTED_EVENT`](#bunnybusmessage_rejected_event)
    - [event key](#event-key-9)
    - [handler parameter(s)](#handler-parameters-9)
  - [`BunnyBus.SUBSCRIBED_EVENT`](#bunnybussubscribed_event)
    - [event key](#event-key-10)
    - [handler parameter(s)](#handler-parameters-10)
  - [`BunnyBus.UNSUBSCRIBED_EVENT`](#bunnybusunsubscribed_event)
    - [event key](#event-key-11)
    - [handler parameter(s)](#handler-parameters-11)
  - [`BunnyBus.RECOVERING_CONNECTION_EVENT`](#bunnybusrecovering_connection_event)
    - [event key](#event-key-12)
    - [handler parameter(s)](#handler-parameters-12)
  - [`BunnyBus.RECOVERED_CONNECTION_EVENT`](#bunnybusrecovered_connection_event)
    - [event key](#event-key-13)
    - [handler parameter(s)](#handler-parameters-13)
  - [`BunnyBus.RECOVERING_CHANNEL_EVENT`](#bunnybusrecovering_channel_event)
    - [event key](#event-key-14)
    - [handler parameter(s)](#handler-parameters-14)
  - [`BunnyBus.RECOVERED_CHANNEL_EVENT`](#bunnybusrecovered_channel_event)
    - [event key](#event-key-15)
    - [handler parameter(s)](#handler-parameters-15)
  - [`BunnyBus.RECOVERY_FAILED_EVENT`](#bunnybusrecovery_failed_event)
    - [event key](#event-key-16)
    - [handler parameter(s)](#handler-parameters-16)
- [`Connection`](#connection)
  - [Getters and Setters](#getters-and-setters-1)
    - [`name`](#name)
    - [`connectionOptions`](#connectionoptions)
    - [`socketOptions`](#socketoptions)
    - [`lock`](#lock)
      - [`blocked`](#blocked)
      - [`connection`](#connection)
  - [Events](#events-1)
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
      - [parameter(s)](#parameters-14)
    - [`contains(name)`](#containsname)
      - [parameter(s)](#parameters-15)
    - [`get(name)`](#getname)
      - [parameter(s)](#parameters-16)
    - [`list()`](#list)
    - [`hasConnection(name)`](#hasconnectionname)
      - [parameter(s)](#parameters-17)
    - [`getConnection(name)`](#getconnectionname)
      - [parameter(s)](#parameters-18)
    - [`async remove(name)`](#async-removename)
      - [parameter(s)](#parameters-19)
    - [`async close(name)`](#async-closename)
      - [parameter(s)](#parameters-20)
  - [Events](#events-2)
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
  - [Events](#events-3)
    - [`ChannelManager.AMQP_CHANNEL_ERROR_EVENT`](#channelmanageramqp_channel_error_event)
      - [key value](#key-value-6)
      - [handler parameters](#handler-parameters)
    - [`ChannelManager.AMQP_CHANNEL_CLOSE_EVENT`](#channelmanageramqp_channel_close_event)
      - [key value](#key-value-7)
      - [handler parmaeters](#handler-parmaeters-6)
    - [`ChannelManager.AMQP_CHANNEL_RETURN_EVENT`](#channelmanageramqp_channel_return_event)
      - [key value](#key-value-8)
      - [handler parmaeters](#handler-parmaeters-7)
    - [`ChannelManager.AMQP_CHANNEL_DRAIN_EVENT`](#channelmanageramqp_channel_drain_event)
      - [key value](#key-value-9)
      - [handler parmaeters](#handler-parmaeters-8)
    - [`ChannelManager.CHANNEL_REMOVED`](#channelmanagerchannel_removed)
      - [key value](#key-value-10)
      - [handler parmaeters](#handler-parmaeters-9)
- [`ChannelManager`](#channelmanager)
  - [Methods](#methods-2)
    - [`async create(name, [queue = null], connectionContext, channelOptions)`](#async-createname-queue--null-connectioncontext-channeloptions)
      - [parameter(s)](#parameters-21)
    - [`contains(name)`](#containsname-1)
      - [parameter(s)](#parameters-22)
    - [`get(name)`](#getname-1)
      - [parameter(s)](#parameters-23)
    - [`list()`](#list-1)
    - [`hasChannel(name)`](#haschannelname)
      - [parameter(s)](#parameters-24)
    - [`getChannel(name)`](#getchannelname)
      - [parameter(s)](#parameters-25)
    - [`async remove(name)`](#async-removename-1)
      - [parameter(s)](#parameters-26)
    - [`async close(name)`](#async-closename-1)
      - [parameter(s)](#parameters-27)
  - [Events](#events-4)
    - [`ChannelManager.CHANNEL_REMOVED`](#channelmanagerchannel_removed-1)
      - [key value](#key-value-11)
      - [handler parmaeters](#handler-parmaeters-10)
- [`HttpClientManager`](#httpclientmanager)
  - [Methods](#methods-3)
    - [`async create(name, connectionOptions, [socketOptions])`](#async-createname-connectionoptions-socketoptions-1)
      - [parameter(s)](#parameters-28)
    - [`contains(name)`](#containsname-2)
      - [parameter(s)](#parameters-29)
    - [`get(name)`](#getname-2)
      - [parameter(s)](#parameters-30)
    - [`list()`](#list-2)
- [`SubscriptionManager`](#subscriptionmanager)
  - [Methods](#methods-4)
    - [`contains(queue, [withConsumerTag])`](#containsqueue-withconsumertag)
    - [`create(queue, handlers, [options])`](#createqueue-handlers-options)
    - [`tag(queue, consumerTag)`](#tagqueue-consumertag)
    - [`get(queue)`](#getqueue)
    - [`clear(queue)`](#clearqueue)
    - [`clearAll()`](#clearall)
    - [`remove(queue)`](#removequeue)
    - [`list()`](#list-3)
    - [`block(queue)`](#blockqueue)
    - [`unblock(queue)`](#unblockqueue)
  - [Events](#events-5)
    - [`SubscriptionManager.CREATED_EVENT`](#subscriptionmanagercreated_event)
      - [key value](#key-value-12)
      - [handler parmaeters](#handler-parmaeters-11)
    - [`SubscriptionManager.TAGGED_EVENT`](#subscriptionmanagertagged_event)
      - [key value](#key-value-13)
      - [handler parmaeters](#handler-parmaeters-12)
    - [`SubscriptionManager.CLEARED_EVENT`](#subscriptionmanagercleared_event)
      - [key value](#key-value-14)
      - [handler parmaeters](#handler-parmaeters-13)
    - [`SubscriptionManager.REMOVED_EVENT`](#subscriptionmanagerremoved_event)
      - [key value](#key-value-15)
      - [handler parmaeters](#handler-parmaeters-14)
    - [`SubscriptionManager.BLOCKED_EVENT`](#subscriptionmanagerblocked_event)
      - [key value](#key-value-16)
      - [handler parmaeters](#handler-parmaeters-15)
    - [`SubscriptionManager.UNBLOCKED_EVENT`](#subscriptionmanagerunblocked_event)
      - [key value](#key-value-17)
      - [handler parmaeters](#handler-parmaeters-16)
- [Error Types](#error-types)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## BunnyBus

`BunnyBus` is a class that hosts all features for communicating with RabbitMQ to provide an easy to use enterprise bus facade.

**Note About Versioning**

A note regarding versioning:  `BunnyBus` attaches the version value found in its `package.json` file to all messages that are sent.  Optionally through the `validateVersion` flag, any messages that are picked up from a subscribed queue which do not match the major semver will be rejected to the error queue.  As an example, message sent from BunnyBus version `1.2.3` will only be accepted from other `BunnyBus` clients with semver range of `1.x.x`.

### Constructor

#### `new BunnyBus([config])`

Creates a new instance of `bunnybus`. Accepts a configuration parameter. See [`config`](#config) for allowed options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus({ hostname : 'red-bee.cloudamqp.com' });

//do work;
```

### Getters and Setters

#### `config`

Setter and Getter for configuration. Accepts the following optional properties:

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
 * `disableQueueCreate` - flag to dictate if automatic queue creation should be turned on/off.  Defaults to `false`.  *[boolean]* **Optional**
* `disableExchangeCreate` - flag to dictate if automatic exchange creation should be turned on/off.  Defaults to `false`.  *[boolean]* **Optional**
 * `dispatchType` - enumerated value to select dispatch mechanism used.  `serial` will flow messages to your message handler(s) in single file.  `partitionSerial` will use a `partitionKeySelector` to calculate a partition key to internally partition messsages allowing for concurrent message dispatching.  `concurrent` will flow messages simultaneously to your message handler(s).  Defaults to `serial`.  *[string]* **Optional**
 * `serialDispatchPartitionKeySelectors` - a key selector that is applied against a message to calculate the partition key to support the `partitionSerial` message scheduler.  An array of template strings can be used where each string can be a [Hoek `reach` template](serialDispatchPartitionKeySelectors). *[Array[string]]* **Optional**
 * `rejectUnroutedMessages` - flag to direct messages that were unroutable to provided handlers to either be automatically rejected or acknowledged off the queue.  The default is silent acknowledgements.  Defaults to `false`.  *[boolean]* **Optional**
 * `rejectPoisonMessages` - flag to direct poison messages to be automatically rejected to a poison queue or acknowledged off the queue.  The default is to forward the message to a poison queue.  Defaults to `true`.  *[boolean]*

Note that updates in the options directed at changing connection string will not take affect immediately.  [`ConnectionManager.close()`](#async-closename) needs to be called manually to invoke a new connection with new settings.

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

    //forward the message to some where such as
    //process.stdout or console.log or syslog.
};

//custom logger
bunnyBus.logger = {
    info  : logHandler,
    debug : logHandler,
    warn  : logHandler,
    error : logHandler,
    fatal : logHandler
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

#### `healthy`

Getter for the health state of the instance

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnyBus.healthy);
//output : true or false
```

### Static Methods

#### `Singleton([config])`

Sets up new, or retrieves an existing singleton instance of BunnyBus. Accepts a configuration parameter. See [`config`](#config) for allowed options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = BunnyBus.Singleton({ hostname : 'red-bee.cloudamqp.com' });

//do work;
```

### Methods

#### `async createExchange({name, type, [options]})`

Creates an exchange.

##### parameter(s)

  * `name` - name of the exchange to be created. *[string]* **Required**
  * `type` - type of exchange to create. Possible values are (`direct`, `fanout`, `header`, `topic`) *[string]* **Required**
  * `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) are proxied through to amqplib `assertExchange`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.createExchange({ name: 'default-exchange', type: 'topic' });
```

#### `async deleteExchange({name, [options]})`

Delete an exchange.

##### parameter(s)

  * `name` - name of the exchange to be deleted. *[string]* **Required**
  * `options` - optional settings. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteExchange) are proxed through to amqplib `deleteExchange`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.deleteExchange({ name: 'default-exchange' });
```

#### `async checkExchange({name})`

Checks if an exchange exists.  The channel closes when the exchange does not exist.

##### parameter(s)

  * `name` - name of the exchange to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkExchange({ name: 'default-exchange' });
```

#### `async createQueue({name, [options]})`

Creates a queue.

##### parameter(s)

  * `name` - name of the queue to be created. *[string]* **Required**
  * `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createQueue({ name: 'queue1' });
```

#### `async deleteQueue(name, [options])`

Delete a queue.

##### parameter(s)

  * `name` - name of the queue to be created. *[string]* **Required**
  * `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue) are proxied through to amqplib `deleteQueue`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

async bunnyBus.deleteQueue({ name: 'queue1' });
```

#### `async checkQueue({name})`

Checks if a queue exists.  Returns a queue info object `{ queue, messageCount, consumerCount }` when it exist.

##### parameter(s)

  * `name` - name of the queue to be checked. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.checkQueue({ name: 'queue1' });
```

#### `async purgeQueue({name})`

Purges a queue.  Will not throw error in cases where queue does not exist.

##### parameter(s)

  * `name` - name of the queue to be purged. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.purgeQueue({ name: 'queue1' });
```

#### `async publish({message, [options]})`

Publish a message onto the bus.

##### parameter(s)

  * `message` - the content being sent to downstream subscribers. *[string|Object|Buffer]* **Required**
   * `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
  * `options` - optional settings. *[Object]* **Optional**
    * `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]* **Optional**
    * `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]* **Optional**
    * `source` - value attached to the header of the message to help with track the origin of messages in your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]* **Optional**
    * `globalExchange` - value to override the exchange specified in [`config`](#config). *[string]* **Optional**
    * `headers` - object used to overlay into the message request header (`payload.properties.headers`).  *[Object]* **Optional**
    * In addition to the above options, all of `amqplib`'s [configuration options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) (except for `headers` and `immediate`) from its `sendToQueue` and `publish` methods can also be passed as top-level properties in the `publish` options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    event : 'some.routeKey'
    // other stuff you want to send
}

await bunnyBus.publish({message});
```

#### `async subscribe({queue, handlers, [options]})`

Subscribe to messages from a given queue.

##### parameter(s)

  * `queue` - the name of the queue to subscribe messages to. A queue with the provided name will be created if one does not exist. *[string]* **Required**
  * `handlers` - a `key` / `handler` hash where the key reflects the name of the `message.event` or `routeKey`.  And the handler reflects a `AsyncFunction` as `async (message, [meta, [ack, [reject, [requeue]]]]) => {}`. *[Object]* **Required**
  * `options` - optional settings. *[Object]* **Optional**
    * `queue` - settings for the queue. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
    * `globalExchange` - value of the exchange to transact through for message publishing.  Defaults to one provided in the [config](#config). *[string]* **Optional**
    * `maxRetryCount` - maximum amount of attempts a message can be requeued.  Defaults to one provided in the [config](#config). *[number]* **Optional**
    * `validatePublisher` - flag for validating messages having `bunnyBus` header.  More info can be found in [config](#config). Defaults to one provided in the [config](#config). *[boolean]* **Optional**
    * `validateVersion` - flag for validating messages generated from the same major version.  More info can be found in [config](#config). Defaults to one provided in the [config](#config). *[boolean]* **Optional**
    * `disableQueueBind` - flag for disabling automatic queue binding.  More info can be found in [config](#config).  Defaults to one provided in the [config](#config).  *[boolean]* **Optional**
    * `rejectUnroutedMessages` - flag for enabling rejection for unroutable messages.  More info can be found in [config](#config).  Defaults to one provided in the [config](#config).  *[boolean]* 
    * `rejectPoisonMessages` - flag for enabling rejection for poison messages.  A poison queue is named by default to `<your queue name>_poison`.  More info can be found in [config](#config).  Defaults to one provided in the [config](#config).  *[boolean]* 

##### handlers

##### `key`

A `key` is the routeKey in RabbitMQ terminology.  `BunnyBus` specifically leverages [topic exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html) to route a message from the exchange to any number of queues that are subscribed.  The keys are normally dot notated and wild cards of `*` (can substitute for exactly one word) and `#` (can substitute for zero or more words).  Keys can look like `vineyard.wine-produced`, `vineyard.wine-sold`, `vineyard.*`, `vineyard.#` and etc...  A bug was found during this implementation regarding expected behavior of wildcard syntax [here](https://github.com/rabbitmq/rabbitmq-server/issues/1383)

##### `handler`

A `handler` is an asynchronous function which contains the following arity.  Order matters.
  * `message` is what was received from the bus.  The message does represent the RabbitMQ `'payload.content` buffer.  The original source of this object is from `payload.content`.
  * `metaData` This object will contain all payload related meta information like `payload.properties.headers`. Headers like the `createdAt` ISO string timestamp and the `transactionId` are included in the `metaData.headers` object.
  * `async ack([option])` is an async function for acknowledging the message off the bus.
    * `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
  * `async rej([option])` is an async function for rejecting the message off the bus to a predefined error queue.  The error queue is named by default to `<your queue name>_error`.  It will also short circuit to `error_bus` when defaults can't be found.
    * `option` *[Object]* **Optional**
      * `reason` - A string that should describe the reason the message is being rejcted *[String]* **Optional**
      * `errorQueue` - A string for a specific error queue that the message should be routed to. *[String]* **Optional**
  * `async requeue()` is an async function for requeuing the message back to the back of the queue.  This is feature circumvents Rabbit's `nack` RPC.  `nack` natively requeues but pushes the message to the front of the queue.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const handlers = {
    route.event1 : async ({message, metaData, ack, rej, requeue}) => {
        await ack();
    },
    route.event2 : async ({message, metaData, ack, rej, requeue}) => {
        if (//something not ready) {
            await requeue();
        } else {
            await ack();
        }
    }
}

await bunnyBus.subscribe({queue: 'queue', handlers });
```

#### `async resubscribe({queue})`

Resubscribes non-active handlers to a queue.  This should be used with [`unsubscribe()`](#async-unsubscribequeue).

##### parameter(s)

  -*`queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.resubscribe({ queue: 'queue1' });
```

#### `async unsubscribe({queue})`

Unsubscribe active handlers that are listening to a queue.

##### parameter(s)

  * `queue` - the name of the queue. *[string]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.unsubscribe({ queue: 'queue1' });
```

#### `await send({message, queue, [options]})`

Send a message directly to a specified queue.

##### note(s)

When `message.event` or `options.routeKey` values are not provided for `routeKey` addressing.  The message will be lost when [`subcribe()`](#async-subscribequeue-handlers-options) handles the queue because messages without a `routeKey` are discarded.

##### parameter(s)

  * `message` - the content being sent directly to specfied queue. *[string|Object|Buffer]* **Required**
    * `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
  * `queue` - the name of the queue. *[string]* **Required**
  * `options` - optional settings. *[Object]* **Optional**
    * `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]* **Optional**
    * `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
    * `source` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]*  **Optional**
    * In addition to the above options, all of `amqplib`'s [configuration options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) (except for `headers` and `immediate`) from its `sendToQueue` and `publish` methods can also be passed as top-level properties in the `send` options.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    // other stuff you want to send
}

await bunnyBus.send({message, queue: 'queue1'});
```

#### `async get({queue, [options]})`

Pop a message directly off a queue.  The payload returned is the RabbitMQ `payload` with `payload.properties` and `payload.content` in its original form.

##### parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const payload = await bunnyBus.get({ queue: 'queue1' });
```

#### `async getAll({queue, handler, [options]})`

Pop all messages directly off of a queue until there are no more.  Handler is called for each message that is popped.

##### parameter(s)

  * `queue` - the name of the queue. *[string]* **Required**
  * `handler` - a handler reflects an `AsyncFunction` as `async ({message, metaData, ack}) => {}`. *[AsyncFunction]* **Required**
  * `options` - optional settings. *[Object]* **Optional**
    * `get` - [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const handler = async ({message, metaData, ack}) => {
    await ack();
}

await bunnyBus.getAll({queue: 'queue1', handler});
```

#### `async stop()`

A destructive action that kills all connection related resources within a `BunnyBus` instance.  Do not use in runtime code unless you know what you are doing.  This method is mainly built to support test frameworks that don't support killing of background async tasks.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.stop();
```

### Internal-use Methods

The following methods are available in the public API, but manual use of them is highly discouraged.

#### `async _autoBuildChannelContext({channelName, [queue = null]})`

Method handles the coordination for creating a connection and channel via the [`ConnectionManager`](#connectionmanager) and [`ChannelManager`](#channelmanager).  This is also responsible for subscribing to error and close events available from the [`Connection`](#connection) and [`Channel`](#channel) context classes which proxy events from the corresponding underlying `amqplib` objects.  

##### `parameter(s)`

* `channelName` - name of the channel to be created or fetched. *[string]* **Required**
* `queue` - name of queue that will be using the channel.  Defaults to `null`.  *[string]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const channelContext = await bunnyBus._autoBuildChannelContext({ channelName: 'channelForQueue1' });
// output : { name, queue, connectionContext, channelOptions, lock, channel }
```

#### `async _recoverConnection()`

Auto retry mechanism to restore all channels and connection that were closed which should still remain active.  This method primarily loops against all active subscribed queues to try and recover them.  When failures happens, an invocation to `process.exit(1)` will be done.  This is invoked internally through event handlers listening to connection and channel events.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

// something bad happened

await bunnyBus._recoverConnection();
```

#### `async _recoverChannel({channelName})`

Auto retry mechanism to restore a specific channel and attached connection that was closed.  When failure happens, an invocation to `process.exit(1)` will be done.  This is invoked internally through event handlers listening to channel events.  This will not revive subscribed queues that are in block state registered through the [`SubscriptionManager`](#subscriptionmanager)

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

// something bad happened

await bunnyBus._recoverChannel({channelName});
```

#### `async _ack({payload, channelName}, [options]})`

The acknowledge method for removing a message off the queue.  Mainly used in handlers through `bind()` parameter injection for methods like [`getAll()`](#async-getallqueue-handler-options) and [`subscribe`](#async-subscribequeue-handlers-options).

##### `parameter(s)`

* `payload` - raw payload from an AMQP result message response. *[Object]* **Required**
* `channelName` - the originating channel the payload came from. *[string]* **Required**
* `options` - not currently used.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const payload = await bunnyBus.get({ queue: 'queue1' });
await bunnyBus.ack({ payload, channelName: 'channelForQueue1' });
```

When supplied through the handler

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.subscribe({ queue: 'queue1' : handlers: {
    'topicA': async (message, ack, rej, requeue) => {
        ack();
    }
}});
```

#### `async _requeue({payload, channelName, queue}, [options])`

Requeues message to any queue while it acknowledges the payload off of the original.  This method does not push the message back to the original queue in the front position.  It will put the message to any desired queue in the back position.  Mainly used in handlers through `bind()` parameter injection for methods like [`getAll()`](#async-getallqueue-handler-options) and [`subscribe()`](#async-subscribequeue-handlers-options).

##### `parameter(s)`

* `payload` - raw payload from an AMQP result message response. *[Object]* **Required**
* `channelName` - the originating channel the payload came from. *[string]* **Required**
* `queue` - the destination queue to push to.  *[string]* **Required**
* `options` - can supply AMQP specific values which is just proxied to [`sentToQueue`](https://www.squaremobius.net/amqp.node/channel_api.html#channel_sendToQueue) *[Object]* **Required**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const payload = await bunnyBus.get({ queue: 'queue1' });
await bunnyBus.requeue({ payload, channelName: 'channelForQueue1', queue: 'queue1' });
```

When supplied through the handler

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.subscribe({ queue: 'queue1' : handlers: {
    'topicA': async (message, ack, rej, requeue) => {
        requeue({ reason: 'wait condition not met' });
    }
}});
```

#### `async _reject({payload, channelName, [errorQueue]}, [options])`

Rejects a message by acknowledging off the originating queue and sending to an error queue of choice.  Mainly used in handlers through `bind()` parameter injection for methods like [`getAll()`](#async-getallqueue-handler-options) and [`subscribe()`](#async-subscribequeue-handlers-options).

##### `parameter(s)`

* `payload` - raw payload from an AMQP result message response. *[Object]* **Required**
* `channelName` - the originating channel the payload came from. *[string]* **Required**
* `errorQueue` - the destination error queue to push to. Defaults to a queue defined in [`config`](#config) *[string]* **Optional**
* `options` - can supply AMQP specific values which is just proxied to [`sentToQueue`](https://www.squaremobius.net/amqp.node/channel_api.html#channel_sendToQueue) for the destination error queue.
  * `reason` - can be supplied which will be caught and added to the message header.  The property of `reason` is used uniformally within all rejection paths in the BunnyBus code base. *[string]* **Optionald**
  * `errorQueue` - the name of the queue to route the error to instead of the safe defaults. *[string]* **Optional**

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const payload = await bunnyBus.get({ queue: 'queue1' });
await bunnyBus.reject({payload, channelName: 'channelForQueue1', errorQueue: 'queue1_error'}, { reason: 'some unforeseen failure' });
```

When supplied through the handler

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

await bunnyBus.subscribe({ queue: 'queue1' : handlers: {
    'topicA': async (message, ack, rej, requeue) => {
        rej({ reason: 'error encountered', errorQueue: 'error-queue-shard-5' });
    }
}});
```

### Events

`BunnyBus` extends `EventEmitter` for emitting logs and system specific events.  Subscription to these events is optional.  `BunnyBus` class also exposes static Getter properties for the name of these public events.

### `BunnyBus.LOG_DEBUG_EVENT`

#### event key

* `log.debug` - debug level logging message.

#### handler parameter(s)

* `...message` - log parameter of n-arity sent. *[any]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.LOG_DEBUG_EVENT', console.log);
```

### `BunnyBus.LOG_INFO_EVENT`

#### event key

* `log.info` - info level logging message.

#### handler parameter(s)

* `...message` - log parameter of n-arity sent. *[any]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.LOG_INFO_EVENT', console.log);
```

### `BunnyBus.LOG_WARN_EVENT`

#### event key

* `log.warn` - warn level logging message.

#### handler parameter(s)

* `...message` - log parameter of n-arity sent. *[any]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.LOG_WARN_EVENT', console.log);
```

### `BunnyBus.LOG_ERROR_EVENT`

#### event key

* `log.error` - error level logging message.

#### handler parameter(s)

* `...message` - log parameter of n-arity sent. *[any]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.LOG_ERROR_EVENT', console.log);
```

### `BunnyBus.LOG_FATAL_EVENT`

#### event key

* `log.fatal` - fatal level logging message.

#### handler parameter(s)

* `...message` - log parameter of n-arity sent. *[any]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.LOG_FATAL_EVENT', console.log);
```

### `BunnyBus.PUBLISHED_EVENT`

#### event key

* `bunnybus.published` - emitted when [`publish()`](#async-publishmessage-options) is successfully called.

#### handler parameter(s)
* `publishOptions` - option sent along with the message header/fields *[Object]*
* `message` - original payload published. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.PUBLISHED_EVENT', (options, message) => {

    //do work
});
```

### `BunnyBus.MESSAGE_DISPATCHED_EVENT`

#### event key

* `bunnybus.message-dispatched` - emitted when subscribing [handlers](#handlers) for a queue is about to be called.

#### handler parameter(s)
* `metaData` - option sent along with the message header/fields *[Object]*
* `message` - the parsed version of the `content` property from the original payload. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.MESSAGE_DISPATCHED_EVENT', (metaData, message) => {

    //do work
});
```

### `BunnyBus.MESSAGE_ACKED_EVENT`

#### event key

* `bunnybus.message-acked` - emitted when [`_ack()`](#async-_ackpayload-channelname-options) is called succesfully.

#### handler parameter(s)
* `metaData` - option sent along with the message header/fields *[Object]*
* `message` - the parsed version of the `content` property from the original payload. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.MESSAGE_ACKED_EVENT', (metaData, message) => {

    //do work
});
```

### `BunnyBus.MESSAGE_REQUEUED_EVENT`

#### event key

* `bunnybus.message-requeued` - emitted when [`_requeue()`](#async-_requeuepayload-channelname-queue-options) is called succesfully.

#### handler parameter(s)
* `metaData` - option sent along with the message header/fields *[Object]*
* `message` - the parsed version of the `content` property from the original payload. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.MESSAGE_REQUEUED_EVENT', (metaData, message) => {

    //do work
});
```

### `BunnyBus.MESSAGE_REJECTED_EVENT`

#### event key

* `bunnybus.message-rejected` - emitted when [`_reject()`](#async-_rejectpayload-channelname-errorqueue-options) is called succesfully.

#### handler parameter(s)
* `metaData` - option sent along with the message header/fields *[Object]*
* `message` - the parsed version of the `content` property from the original payload. *[string|Object|Buffer]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.MESSAGE_REJECTED_EVENT', (metaData, message) => {

    //do work
});
```

### `BunnyBus.SUBSCRIBED_EVENT`

#### event key

* `bunnybus.subscribed` - emitted when [`subcribe()`](#async-subscribequeue-handlers-options) is successfully called.

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

* `bunnybus.unsubscribed` - emitted when [`unsubcribe()`](#async-unsubscribequeue) is successfully called.

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

### `BunnyBus.RECOVERING_CONNECTION_EVENT`

#### event key

* `bunnybus.recovering-connection` - emitted when [`AMQP_CONNECTION_CLOSE_EVENT`](#connectionmanageramqp_connection_close_event) is invoked.

#### handler parameter(s)

* `connectionName` - name of the connection involved with the recovery event.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERING_CONNECTION_EVENT', (connectionName) => {

    // do work to handle the case when a connection or channel is having a failure
});
```

### `BunnyBus.RECOVERED_CONNECTION_EVENT`

#### event key

* `bunnybus.recovered-connection` - emitted when the corresponding recovering connection event is restored

#### handler parameter(s)

* `connectionName` - name of the connection involved with the recovery event.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERED_CONNECTION_EVENT', (connectionName) => {

    // do work to handle the case when a connection or channel is having a failure
});
```

### `BunnyBus.RECOVERING_CHANNEL_EVENT`

#### event key

* `bunnybus.recovering-channel` - emitted when [`AMQP_CHANNEL_CLOSE_EVENT`](#channelmanageramqp_channel_close_event) is invoked.

#### handler parameter(s)

* `channelName` - name of the channel involved with the recovery event.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERING_CHANNEL_EVENT', (channelName) => {

    // do work to handle the case when a connection or channel is having a failure
});
```

### `BunnyBus.RECOVERED_CHANNEL_EVENT`

#### event key

* `bunnybus.recovered-channel` - emitted when the corresponding recovering channel event is restored

#### handler parameter(s)

* `channelName` - name of the channel involved with the recovery event.

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERED_CHANNEL_EVENT', (channelName) => {

    // do work to handle the case when a connection or channel is having a failure
});
```

### `BunnyBus.RECOVERY_FAILED_EVENT`

#### event key

* `bunnybus.recovery-failed` - emitted when recovery efforts leads to a failed state.

#### handler parameter(s)

* `err` - a error object of type `Error` *[Object]*

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.on('BunnyBus.RECOVERY_FAILED_EVENT', (err) => {

    // do work to handle the case when a connection or channel is having a failure
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

* `err` - a error object of type `Error` *[Object]*
* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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
* `connectionOptions` - options used to create the `amqplib` connection.  See [`config`](#config) for allowed options.  Only relevant subset is used.  *[Object]* **Required**
* `socketOptions` - options used to configure the underlying socket/tls behavior.  Refer to [`net`](https://nodejs.org/api/net.html) / [`tls'](https://nodejs.org/api/tls.html) modules for configuration values.  *[Object]* **Optional**

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

* `connectionContext` - connection context that is the [`Connecton`](#connection) class *[Object]*

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

##### handler parameters

* `err` - a error object of type `Error` *[Object]*
* `channelContext` - channel context that is the [`Channel`](#channel) class *[Object]*

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

* `channelContext` - channel context that is the [`Channel`](#channel) class *[Object]*

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

* `payload` - The message that was sent with no matching route recipient. *[Object]*

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

* `channelContext` - channel context that is the [`Channel`](#channel) class *[Object]* 

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.channels.get('channelName').on(ChannelManager.AMQP_CHANNEL_DRAIN_EVENT, (context) => {

    console.log(context);
    // output : { name, queue, connectionContext, channelOptions, lock, channel }
});
```

#### `ChannelManager.CHANNEL_REMOVED`

##### key value

* `channelManager.removed` - emitted when the channel context is removed by [`close()`](#async-closename-1).

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[Object]* 

```javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connections.get('connectionName').on(ChannelManager.CHANNEL_REMOVED, (context) => {

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
* `connectionContext` - the connection context to use for instantiation of a channel from.  *[Object]* **Required**
* `channelOptions` - options used to create the `amqplib` connection.  See [`config`](#config) for allowed options.  Only relevant subset is used like `prefetch`  *[Object]* **Required**

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

* `channelManager.removed` - emitted when the channel context is removed by [`remove()`](#async-removename-1).

##### handler parmaeters

* `channelContext` - channel context that is the [`Channel`](#channel) class *[Object]* 

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

* `subscription` - subscription context that was created *[Object]*

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

* `subscription` - subscription context that was tagged *[Object]*

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

* `subscription` - subscription context that had its consumer tag removed *[Object]*

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

* `subscription` - subscription context that was removed *[Object]*

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
