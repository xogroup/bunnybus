# 1.0.0 API Reference

- [BunnyBus](#BunnyBus)
  - [`new BunnyBus(config)`](#new-bunnybusconfig)
    - [Getters and Setters](#getters-and-setters)
      - [`config`](#config)
      - [`subscriptions`](#subscriptions)
      - [`logger`](#logger)
      - [`promise`](#promise)
      - [`connectionString`](#connectionstring)
      - [`connection`](#connection)
      - [`hasConnection`](#hasconnection)
      - [`channel`](#channel)
      - [`hasChannel`](#haschannel)
    - [Methods](#methods)
      - [Public API](#public-api)
        - [`createExchange(name, type, [options, [callback]])`](#createExchangename-type-options-callback)
        - [`deleteExchange(name, [options, [callback]])`](#deleteExchangename-options-callback)
        - [`checkExchange(name, [callback])`](#checkExchangename-callback)
        - [`createQueue(name, [options, [callback]])`](#createQueuename-options-callback)
        - [`deleteQueue(name, [options, [callback]])`](#deleteQueuename-options-callback)
        - [`checkQueue(name, [callback])`](#checkQueuename-callback)
        - [`publish(message, [options, [callback]])`](#publishmessage-options-callback)
        - [`unsubscribe(queue, [callback])`](#unsubscribequeue-callback)
        - [`subscribe(queue, handlers, [options, [callback]])`](#subscribequeue-handlers-options-callback)
        - [`send(message, queue, [options, [callback]])`](#sendmessage-queue-options-callback)
        - [`get(queue, [options, [callback]])`](#getqueue-options-callback)
      - [Internal-use methods](#internal-use-methods)
        - [`_recoverConnectChannel()`](#_recoverconnectchannel)
        - [`_createConnection([callback])`](#_createConnectioncallback)
        - [`_closeConnection([callback])`](#_closeConnectioncallback)
        - [`_createChannel([callback])`](#_createChannelcallback)
        - [`_closeChannel([callback])`](#_closeChannelcallback)
  - [Events (`EventEmitter`)](#events-eventemitter)
    - [`BunnyBus.LOG_DEBUG_EVENT`](#bunnybuslog_debug_event)
    - [`BunnyBus.LOG_INFO_EVENT`](#bunnybuslog_info_event)
    - [`BunnyBus.LOG_WARN_EVENT`](#bunnybuslog_warn_event)
    - [`BunnyBus.LOG_ERROR_EVENT`](#bunnybuslog_error_event)
    - [`BunnyBus.LOG_FATAL_EVENT`](#bunnybuslog_fatal_event)
    - [`BunnyBus.PUBLISHED_EVENT`](#bunnybuspublished_event)
    - [`BunnyBus.SUBSCRIBED_EVENT`](#bunnybussubscribed_event)
    - [`BunnyBus.UNSUBSCRIBED_EVENT`](#bunnybusunsubscribed_event)
    - [`BunnyBus.RECOVERING_EVENT`](#bunnybusrecovering_event)
    - [`BunnyBus.RECOVERED_EVENT`](#bunnybusrecovered_event)
    - [`BunnyBus.AMQP_CONNECTION_ERROR_EVENT`](#bunnybusamqp_connection_error_event)
    - [`BunnyBus.AMQP_CHANNEL_ERROR_EVENT`](#bunnybusamqp_channel_error_event)   
  - [`SubscriptionManager`](#subscriptionmanager)
    - [`contains(queue, [withConsumerTag])`](#containsqueue-withconsumertag)
    - [`create(queue, [consumerTag, [handlers, [options]]])`](#createqueue-consumertag-handlers-options)
    - [`tag(queue, consumerTag)`](#tagqueue-consumertag)
    - [`get(queue)`](#getqueue)
    - [`clear(queue)`](#clearqueue)
    - [`remove(queue)`](#removequeue)
    - [`list()`](#list)
    - [`block(queue)`](#blockqueue)
    - [`unblock(queue)`](#unblockqueue)
  
##BunnyBus

The `BunnyBus` is a class that instantiates into a singleton.  It hosts all features for communicating with RabbitMQ to provide an easy to use enterprise bus facade.

###`new BunnyBus(config)`

Creates a new singleton instance of `bunnybus`. Accepts a configuration parameter. See [`config`](#config) for allowed options.

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus({ server : 'red-bee.cloudamqp.com' });

//do work;
```

#### Getters and Setters

#####`config`

Setter and Getter for singleton configuration. Accepts the following optional properties:

 * `ssl` - value for creating a secure connection.  Used in the connection string.  Defaults to `false`. *[boolean]* **Optional**
 * `user` - value of the username.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `password` - value of the password.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `server` - value of the server address.  Just the host portion of the URI.  eg `red-bee.cloudamqp.com` or `rabbitbox` or `56.23.0.123`.  Used in the connection string.  Defaults to `127.0.0.1`. *[string]* **Optional**
 * `port` - value of the port for client connections.  Used in the conneciton string.  Defaults to `5672`. *[number]* **Optional**
 * `vhost` - value of the virtual host the user connects to.  Used in the connection string.  Defaults to `%2f`. *[string]* **Optional**
 * `heartbeat` -  value negotiated between client and server on when the TCP tunnel is considered dead.  Unit is a measurement of milliseconds.  Used in the connection string.  Defaults to `2000`. *[number]* **Optional**
 * `globalExchange` - value of the exchange to transact through for message publishing.  This is the default used when one is not provided as an within the `options` for any `BunnyBus` methods that supports one transactionally.  Defaults to `default-exchange`. *[string]* **Optional**
 * `prefetch` - value of the maximum number of unacknowledged messages allowable in a channel.  Defaults to `5`. *[number]* **Optional**

  ```Javascript
  const BunnyBus = require('bunnybus');
  const bunnybus = new BunnyBus();
  
  //deferred configuration
  bunnybus.config = { server : 'red-bee.cloudamqp.com'};
  
  //do work
  ```

#####`subscriptions`

Getter for subscriptions.  A reference to the [Subscription Manager](#subscription-manager).

```Javascript
const BunnyBus = require('bunnybus');
const bunnybus = new BunnyBus();

console.log(bunnyBus.subscriptions.get('queue'));

//output : { queue : 'queue1', consumerTag : 'abc123', handlers : {}, options : {}}
```

#####`logger`

Setter and Getter for logger.  By default, `BunnyBus` will instantiate and set a logger using the `EventEmitter`.  When a custom logger is set, `BunnyBus` will **no** longer emit log messages through the `EventEmitter`.  The Setter will also validate the contract of the logger to ensure the following keys exist [`debug`, `info`, `warn`, `error`, `fatal`] and are of type `Function`.  When validation fails, the existing logger will not be overriden.
  
```Javascript
const BunnyBus = require('bunnybus');
const bunnybus = new BunnyBus();

const logHandler = (message) => {
  
    //log something to some where
};

//custom logger
bunnybus.logger = { 
    info = logHandler,
    debug = logHandler,
    warn = logHandler,
    error = logHandler,
    fatal = logHandler
};
```

#####`promise`

Setter and Getter for promise. By default, `BunnyBus` will utilize the native Promise implementation. Supported promise implementations must be initialized as Constructor functions and must pass `resolve` and `reject` functions to the provided callback. If an unsupported promise library is passed, the existing promise implementation will not be overridden.

```Javascript
const Bluebird = require('bluebird');
const BunnyBus = require('bunnybus');
const bunnybus = new BunnyBus();

bunnybus.promise = Bluebird
// All promises returned by bunnybus will now be Bluebird promises
```

#####`connectionString`

Getter for AMQP connection string.

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnybus.connectionString);
//output : amqp://guest:guest@127.0.0.1:5672/%2f?heartbeat=2000
```

#####`connection`

Setter and Getter for AMQP connection object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a connection has to be manually set, it is highly recommended to do so before any other operation have been invoked.

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

Amqp.connect('<connection-string>', (err, connection) => {
    bunnyBus.connection = connection;
});
```

#####`hasConnection`

Getter for existence for an active AMQP connection object.

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasConnection;
//true|false
```

#####`channel`

Setter and Getter for AMQP confirmation channel object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a channel has to be manually set, it is highly recommended to do so before any other operation have been invoked.

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connection.createConfirmationChannel((err, channel) => {
    bunnyBus.channel = channel;
});
```

#####`hasChannel`

Getter for existence for an active AMQP channel object

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasChannel;
//true|false
```

#### Methods

All methods of `bunnybus` which accept an optional callback function will return a native `Promise` instead if no callback is provided.

### Public API

The following methods are the primary-use methods you should utilize for managing exchanges and queues and for sending and getting messages.

####`createExchange(name, type, [options, [callback]])`

Creates an exchange.

#####parameter(s)

  - `name` - name of the exchange to be created. *[string]* **Required**
  - `type` - type of exchange to create. Possible values are (`direct`, `fanout`, `header`, `topic`) *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) are proxied through to amqplib `assertExchange`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createExchange('default-exchange', 'topic', (err) => {});

// promise api
bunnyBus.createExchange('default-exchange', 'topic')
    .then()
    .catch((err) => {});
```

####`deleteExchange(name, [options, [callback]])`

Delete an exchange.

#####parameter(s)

  - `name` - name of the exchange to be deleted. *[string]* **Required**
  - `options` - optional settings. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteExchange) are proxed through to amqplib `deleteExchange`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.deleteExchange('default-exchange', (err) => {});

// promise api
bunnyBus.deleteExchange('default-exchange')
    .then()
    .catch((err) => {});
```

####`checkExchange(name, [callback])`

Checks an exchange exist.  Channel closes when exchange does not exist.

#####parameter(s)

  - `name` - name of the exchange to be checked. *[string]* **Required**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.checkExchange('default-exchange', (err) => {});

// promise api
bunnyBus.checkExchange('default-exchange')
    .then()
    .catch((err) => {});
```

####`createQueue(name, [options, [callback]])`

Creates a queue.

#####parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createQueue('queue1', (err) => {});

// promise api
bunnyBus.createQueue('queue1')
    .then()
    .catch((err) => {});
```

####`deleteQueue(name, [options, [callback]])`

Delete a queue.

#####parameter(s)

  - `name` - name of the queue to be created. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue) are proxied through to amqplib `deleteQueue`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.deleteQueue('queue1', (err) => {});

// promise api
bunnyBus.deleteQueue('queue1')
    .then()
    .catch((err) => {});
```

####`checkQueue(name, [callback])`

Checks a queue exist.  Channel closes when queue does not exist.

#####parameter(s)

  - `name` - name of the queue to be checked. *[string]* **Required**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.checkQueue('queue1', (err) => {});

// promise api
bunnyBus.checkQueue('queue1')
    .then()
    .catch((err) => {});
```

####`publish(message, [options, [callback]])`

Publish a message onto the bus.

#####parameter(s)

  - `message` - the content being sent to downstream subscribers. *[string|Object|Buffer]* **Required**
   - `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
  - `options` - optional settings. *[Object]* **Optional**
    - `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]*  **Optional**
    - `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
    - `callingModule` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]* 
 **Optional**
    - `globalExchange` - value to override the exchange specified in `config`. *[string]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    event : 'some.routeKey'
    // other stuff you want to send
}

bunnyBus.publish(message, (err) => {});

// promise api
bunnyBus.publish(message)
    .then()
    .catch((err) => {});
```

####`subscribe(queue, handlers, [options, [callback]])`

Subscribe to messages from the queue.

#####parameter(s)

  - `queue` - the name of the queue to subscribe messages to. *[string]* **Required**
  - `handlers` - a `key` / `handler` hash where the key reflects the name of the `message.event` or `routeKey`.  And the handler reflects a `Function` as `(message, [ack, [reject, [requeue]]]) => {}`. *[Object]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `queue` - settings for the queue. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

##### handlers

##### `key`

A `key` is the routeKey in RabbitMQ terminology.  `BunnyBus` specifically leverages [topic exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html) to route a message from the exchange to any number of queues that are subscribed.  The keys are normally dot notated and wild cards of `*` (can substitute for exactly one word) and `#` (can substitute for zero or more words).  Keys can look like `vineyard.wine-produced`, `vineyard.wine-sold`, `vineyard.*`, `vineyard.#` and etc...

##### `handler`

A `handler` is a function which contains the following arity.  Order matters.
  - `message` is what was received from the bus.  The message does represent the RabbitMQ `'payload.content` buffer.  The original source of this object is from `payload.content`.
  - `ack([option, [callback]])` is a function for acknowledging the message off the bus.
    - `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
    - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**
  - `reject([option, [callback]])` is a function for rejecting the message off the bus to a predefined error queue.  The error queue is named by default `<your queue name>_error`.  It will also short circuit to `error_bus` when defaults can't be found.
    - `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
    - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**
  - `requeue([callback])` is a function for requeuing the message back to the back of the queue.  This is feature circumvents Rabbit's `nack` RPC.  `nack` natively requeues but pushes the message to the front of the queue.
    - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const handlers = {
    route.event1 : (message, ack, reject, requeue) => {
        ack(() => {});
    },
    route.event2 : (message, ack, reject, requeue) => {
        if (//something not ready) {
            requeue(() => ());
        } else {
            ack(() => {});
        }
    }
}

bunnyBus.subscribe('queue', handlers, (err) => {});

// promise api
const handlers = {
    route.event1 : (message, ack, reject, requeue) => {
        return ack()
            .then();
    },
    route.event2 : (message, ack, reject, requeue) => {
        if (//something not ready) {
            return requeue()
                .then();
        } else {
            return ack()
                .then();
        }
    }
}

bunnyBus.subscribe('queue', handlers)
    .then()
    .catch((err) => {});
```

####`unsubscribe(queue, [callback])`

Unsubscribe from listening to a queue.

#####parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.unsubscribe('queue1', (err) => {});

// promise api
bunnyBus.unsubscribe('queue1')
    .then()
    .catch((err) =>{});
```

####`send(message, queue, [options, [callback]])`

Send a message directly to a queue.

#####parameter(s)

  - `message` - the content being sent directly to specfied queue. *[string|Object|Buffer]* **Required**
  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings. *[Object]* **Optional**
    - `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
    - `callingModule` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]*  **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    // other stuff you want to send
}

bunnyBus.send(message, 'queue1', (err) => {});

// promise api
bunnyBus.send(message, 'queue1')
    .then()
    .catch((err) =>{});
```

####`get(queue, [options, [callback]])`

Pop a message directly off a queue.  The payload returned is the RabbitMQ `payload` with `payload.properties` and `payload.content` in its original form.

#####parameter(s)

  - `queue` - the name of the queue. *[string]* **Required**
  - `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**
  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    // other stuff you want to send
}

bunnyBus.get('queue1', (err, result) => {
    //result contains an rabbit payload object
    //JSON.tostring(result.content) will contain the message that was sent.
});

// promise api
bunnyBus.get('queue1')
    .then((result) => {})
    .catch((err) =>{});
```

### Internal-use Methods

The following methods are available in the public API, but manual use of them is highly discouraged.
Please see the [Public API](#public-api) for the primary BunnyBus methods.

####`_recoverConnectChannel()`

Auto retry mechanism when to restore either a connection or channel when it goes corrupt.  The retry mechanism will attempt 240 times every 15 seconds.  When a connection can not be restored, `process.exit(1)` will be called.  This is invoked internally through error handlers.

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

// something bad happened

bunnyBus._recoverConnectChannel();
```

####`_createConnection([callback])`

Create a connection from settings defined through custom or default configurations.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._createConnection((err) => {});

// promise api
bunnyBus._createConnection()
    .then()
    .catch((err) => {});
```

####`_closeConnection([callback])`

Closes an opened connection if one exist.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._closeConnection((err) => {});

// promise api
bunnyBus._closeConnection()
    .then()
    .catch((err) => {});
```

####`_createChannel([callback])`

Create a channel from an existing connection.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._createChannel((err) => {});

// promise api
bunnyBus._createChannel()
    .then()
    .catch((err) => {});
```

####`_closeChannel([callback])`

Closes an channel if one exist.

  - `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus._closeChannel((err) => {});

// promise api
bunnyBus._closeChannel()
    .then()
    .catch((err) => {});
```

##Events (`EventEmitter`)

`BunnyBus` extends `EventEmitter` for emitting logs and system specific events.  Subscription to these events are optional.  `BunnyBus` class also exposes static Getter properties for the name of these public events.

###`BunnyBus.LOG_DEBUG_EVENT`

####event key

* `log.debug` - debug level logging message.

####handler parameter(s)

* `message` - debug message sent. *[string]*

```Javascript
const BunnyBus = require('bunnybus');
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_DEBUG_EVENT', pino.debug);
bunnyBus.on('log.debug', pino.debug);
```

###`BunnyBus.LOG_INFO_EVENT`

####event key

* `log.info` - info level logging message.

####handler parameter(s)

* `message` - info message sent. *[string]*

```Javascript
const BunnyBus = require('bunnybus');
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_INFO_EVENT', pino.info);
bunnyBus.on('log.info', pino.info);
```

###`BunnyBus.LOG_WARN_EVENT`

####event key

* `log.warn` - warn level logging message.

####handler parameter(s)

* `message` - warn message sent. *[string]*

```Javascript
const BunnyBus = require('bunnybus');
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_WARN_EVENT', pino.warn);
bunnyBus.on('log.warn', pino.warn);
```

###`BunnyBus.LOG_ERROR_EVENT`

####event key

* `log.error` - error level logging message.

####handler parameter(s)

* `message` - error message sent. *[string]*

```Javascript
const BunnyBus = require('bunnybus');
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_ERROR_EVENT', pino.error);
bunnyBus.on('log.error', pino.error);
```

###`BunnyBus.LOG_FATAL_EVENT`

####event key

* `log.fatal` - fatal level logging message.

####handler parameter(s)

* `message` - fatal message sent. *[string]*

```Javascript
const BunnyBus = require('bunnybus');
const pino = require('pino')();

bunnyBus.on('BunnyBus.LOG_FATAL_EVENT', pino.fatal);
bunnyBus.on('log.fatal', pino.fatal);
```

###`BunnyBus.PUBLISHED_EVENT`

####event key

* `bunnybus.published` - emitted when [`publish()`](#publishmessage-options-callback) is successfully called.

####handler parameter(s)

* `message` - original payload published. *[string|Object|Buffer]*

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.PUBLISHED_EVENT', (message) => {

    //do work
});
```

###`BunnyBus.SUBSCRIBED_EVENT`

####event key

* `bunnybus.subscribed` - emitted when [`subcribe()`](#subscribequeue-handlers-options-callback) is successfully called.

####handler parameter(s)

* `queue` - name of queue subcribed for. *[string]*

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.SUBSCRIBED_EVENT', (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

###`BunnyBus.UNSUBSCRIBED_EVENT`

####event key

* `bunnybus.unsubscribed` - emitted when [`unsubcribe()`](#unsubscribequeue-callback) is successfully called.

####handler parameter(s)

* `queue` - name of queue unsubscribed from. *[string]*

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.UNSUBSCRIBED_EVENT', (queue) => {

    console.log(queue);
    // output : 'queue1'
});
```

###`BunnyBus.RECOVERING_EVENT`

####event key

* `bunnybus.recovering` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is first invoked.

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.RECOVERING_EVENT', () => {

    // do work to handle the case when a connection or channel is having a failure
});
```

###`BunnyBus.RECOVERED_EVENT`

####event key

* `bunnybus.recovered` - emitted when [`_recoverConnectChannel()`](#recoverconnectchannel) is successfully restores connections and channel.

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.RECOVERED_EVENT', () => {

    // do work to handle the case when a connection or channel is restored
});
```

###`BunnyBus.AMQP_CONNECTION_ERROR_EVENT`

####event key

* `amqp.connection.error'` - emitted when amqplib encounters a corrupted connection state.

####handler parameter(s)

* `err` - error from amqplib. *[Object]*

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.AMQP_CONNECTION_ERROR_EVENT', (err) => {

    // do work
});
```

###`BunnyBus.AMQP_CHANNEL_ERROR_EVENT`

####event key

* `amqp.channel.error'` - emitted when amqplib encounters a corrupted channel state.

####handler parameter(s)

* `err` - error from amqplib. *[Object]*

```Javascript
const BunnyBus = require('bunnybus');

bunnyBus.on('BunnyBus.AMQP_CHANNEL_ERROR_EVENT', (err) => {

    // do work
});
```

##`SubscriptionManager`

This class manages the state for all subscriptions registered with queues.  A subscription is an association between a queue and handlers associated with it.  A subscription is created when [`subscribe()`](#subscribequeue-handlers-options-callback) is invoked succesfully. The `SubscriptionManager` is also an `EventEmitter` so when actions like `create`, `clear` and `remove` are called, events are emitted so `BunnyBus` can apply the corresponding behavior to meet the desired state.

###`contains(queue, [withConsumerTag])`

Checks if a queue has a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `withConsumerTag` - requires the condition of a subscription to be active.  Defaults to `true`. *[boolean]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.contains('queue1');
const message = {
    // other stuff you want to send
}
```

###`create(queue, handlers, [options])`

Creates a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `handlers` - handlers parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Required**
* `options` - options parameter passed through the [`subscribe()`](#subscribequeue-handlers-options-callback) method.  *[Object]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.create('queue1');
}
```

###`tag(queue, consumerTag)`

Tag a subscription.

* `queue` - the name of the queue. *[string]* **Required**
* `consumerTag` - a value returned from the [`consume()`](http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume) method of amqplib.  *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.tag('queue1', 'abcd1234');
}
```

###`get(queue)`

Returns a clone of the subscription if the queue exist.  Returns `undefined` when it does not exist.

* `queue` - the name of the queue. *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.get('queue1');
}
```

###`clear(queue)`

Clears a subscription of the `consumerTag`.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.clear('queue1');
}
```

###`remove(queue)`

Removes a subscription from registrar.  Returns `true` when successful and `false` when not.

* `queue` - the name of the queue. *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.remove('queue1');
}
```

###`list()`

Returns a list of cloned subscriptions in registrar.


```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.list();

//output : [ subscriptions ]
}
```

###`block(queue)`

Adds a queue to a ban list.  Queues in this list lives in a desired state.  Once a queue name is added to this list, `BunnyBus` will try to unsubscribe any active consumed queues.

* `queue` - the name of the queue. *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.block('queue1');
}
```

###`unblock(queue)`

Removes a queue to a ban list.  Queues in this list lives in a desired state.  Once a queue name is removed from this list, `BunnyBus` will try to re-subscribe any unactive queues.

* `queue` - the name of the queue. *[string]* **Required**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnybus.subscriptions.unblock('queue1');
}
```
