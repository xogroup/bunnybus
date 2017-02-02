# 1.0.0 API Reference

- [BunnyBus](#BunnyBus)
  - [`new BunnyBus(config)`](#new-bunnybusconfig)
    - [`config`](#config)
    - [`logger`](#logger)
    - [`connectionString`](#connectionString)
    - [`connection`](#connection)
    - [`hasConnection`](#hasConnection)
    - [`channel`](#channel)
    - [`hasChannel`](#hasChannel)
    - [`createConnection([callback])`](#createConnectioncallback)
    - [`closeConnection([callback])`](#closeConnectioncallback)
    - [`createChannel([callback])`](#createChannelcallback)
    - [`closeChannel([callback])`](#closeChannelcallback)
    - [`createExchange(name, type, [options, [callback]])`](#createExchangename-type-options-callback)
    - [`deleteExchange(name, [options, [callback]])`](#deleteExchangename-options-callback)
    - [`checkExchange(name, [callback])`](#checkExchangename-callback)
    - [`createQueue(name, [options, [callback]])`](#createQueuename-options-callback)
    - [`deleteQueue(name, [options, [callback]])`](#deleteQueuename-options-callback)
    - [`checkQueue(name, [callback])`](#checkQueuename-callback)
    - [`publish(message, [options, [callback]])`](#publishmessage-options-callback)
    - [`subscribe(queue, handlers, [options, [callback]])`](#subscribequeue-handlers-options-callback)
    - [`send(message, queue, [options, [callback]])`](#sendmessage-queue-options-callback)
    - [`get(queue, [options, [callback]])`](#getqueue-options-callback)
  - [Events](#Events)
    -[Examples](#Examples)
  
##BunnyBus

The `BunnyBus` is a class that instantiates into a singleton.  It hosts all features for communicating with RabbitMQ to provide an easy to use enterprise bus facade.

###`new BunnyBus(config)`

Creates a new singleton instance of `bunnybus`.
* `config` - configuration settings for `BunnyBus`.
 * `ssl` - value for creating a secure connection.  Used in the connection string.  Defaults to `false`. *[boolean]* **Optional**
 * `user` - value of the username.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `password` - value of the password.  Used in the connection string.  Defaults to `guest`. *[string]* **Optional**
 * `server` - value of the server address.  Just the host portion of the URI.  eg `red-bee.cloudamqp.com` or `rabbitbox`.  Used in the connection string.  Defaults to `rabbitmq`. *[string]* **Optional**
 * `port` - value of the port for client connections.  Used in the conneciton string.  Defaults to `5672`. *[number]* **Optional**
 * `vhost` - value of the virtual host the user connects to.  Used in the connection string.  Defaults to `%2f`. *[string]* **Optional**
 * `heartbeat` -  value negotiated between client and server on when the TCP tunnel is considered dead.  Unit is a measurement of milliseconds.  Used in the connection string.  Defaults to `2000`. *[number]* **Optional**
 * `globalExchange` - value of the exchange to transact through for message publishing.  This is the default used when one is not provided as an within the `options` for any `BunnyBus` methods that supports one transactionally.  Defaults to `default-exchange`. *[string]* **Optional**
 * `prefetch` - value of the maximum number of unacknowledged messages allowable in a channel.  Defaults to `5`. *[number]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus({ server : 'red-bee.cloudamqp.com' });

//do work;
```

###`config`

Setter and Getter for configuration.

```Javascript
const BunnyBus = require('bunnybus');
const bunnybus = new BunnyBus();

//deferred configuration
bunnybus.config = { server : 'red-bee.cloudamqp.com'};

//do work
```

###`logger`

Setter and Getter for logger.  By default, `BunnyBus` will instantiate and set a logger using the `EventEmitter`.  When a custom logger is set, `BunnyBus` will **no** longer emit log messages.

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

###`connectionString`

Getter for AMQP connection string.

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

console.log(bunnybus.connectionString);
//output : amqp://guest:guest@rabbitmq:5672/%2f?heartbeat=2000
```

###`connection`

Setter and Getter for AMQP connection object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a connection has to be manually set, it is highly recommended to do so before any other operation have been invoked.


```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

Amqp.connect('<connection-string>', (err, connection) => {
    bunnyBus.connection = connection;
});
```

###`hasConnection`

Getter for existence for an active AMQP connection object.

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasConnection;
//true|false
```

###`channel`

Setter and Getter for AMQP confirmation channel object.  While this property setter is available, it is strongly discouraged to set this manually.  Connections and channels have lifecycle responsibilties to objects already instantiated through them.  Consequences of switching out a connection or channel midway through an operation will result in corruption of all messages that are in progress of being delivered.  If a channel has to be manually set, it is highly recommended to do so before any other operation have been invoked.

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.connection.createConfirmationChannel((err, channel) => {
    bunnyBus.channel = channel;
});
```

###`hasChannel`

Getter for existence for an active AMQP channel object

```Javascript
const Amqp = require('amqplib');
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.hasChannel;
//true|false
```

###`createConnection([callback])`

Create a connection from settings defined through custom or default configurations.  This method should not be called manually.

* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createConnection((err) => {});
```

###`closeConnection([callback])`

Closes an opened connection if one exist.  This method should not be called manually.

* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.closeConnection((err) => {});
```

###`createChannel([callback])`

Create a channel from an existing connection.  This method should not be called manually.

* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createChannel((err) => {});
```

###`closeChannel([callback])`

Closes an channel if one exist.  This method should not be called manually.

* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.closeChannel((err) => {});
```

###`createExchange(name, type, [options, [callback]])`

Creates an exchange

* `name` - name of the exchange to be created. *[string]* **Required**
* `type` - type of exchange to create. Possible values are (`direct`, `fanout`, `header`, `topic`) *[string]* **Required**
* `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) are proxied through to amqplib `assertExchange`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createExchange('default-exchange', 'topic', (err) => {});
```

###`deleteExchange(name, [options, [callback]])`

Delete an exchange

* `name` - name of the exchange to be deleted. *[string]* **Required**
* `options` - optional settings. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteExchange) are proxed through to amqplib `deleteExchange`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.deleteExchange('default-exchange', (err) => {});
```

###`checkExchange(name, [callback])`

Checks an exchange exist.  Channel closes when exchange does not exist.

* `name` - name of the exchange to be checked. *[string]* **Required**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.checkExchange('default-exchange', (err) => {});
```

###`createQueue(name, [options, [callback]])`

Creates a queue

* `name` - name of the queue to be created. *[string]* **Required**
* `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.createQueue('queue1', (err) => {});
```

###`deleteQueue(name, [options, [callback]])`

Delete a queue

* `name` - name of the queue to be created. *[string]* **Required**
* `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue) are proxied through to amqplib `deleteQueue`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.deleteQueue('queue1', (err) => {});
```

###`checkQueue(name, [callback])`

Checks a queue exist.  Channel closes when queue does not exist.

* `name` - name of the queue to be checked. *[string]* **Required**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

bunnyBus.checkQueue('queue1', (err) => {});
```

###`publish(message, [options, [callback]])`

Publish a message onto the bus

* `message` - the content being sent to downstream subscribers. *[string|Object|Buffer]* **Required**
 * `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
* `options` - optional settings. *[Object]* **Optional**
 * `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]*  **Optional**
 * `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
 * `callingModule` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]* 
 **Optional**
 * `globalExchange` - value to override the exchange specified in `config`. *[string]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    event : 'some.routeKey'
    // other stuff you want to send
}

bunnyBus.publish(message, (err) => {});
```

###`subscribe(queue, handlers, [options, [callback]])`

Subscribe to messages from the bus

* `queue` - the name of the queue to subscribe messages to. *[string]* **Required**
* `handlers` - a `key` / `handler` hash where the key reflects the name of the `message.event` or `routeKey`.  And the handler reflects a `Function` as `(message, [ack, [reject, [requeue]]]) => {}`. *[Object]* **Required**
* `options` - optional settings. *[Object]* **Optional**
 * `queue` - settings for the queue. [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) are proxied through to amqplib `assertQueue`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

#### handlers

##### `key`

A `key` is the routeKey in RabbitMQ terminology.  `BunnyBus` specifically leverages [topic exchange](https://www.rabbitmq.com/tutorials/tutorial-five-python.html) to route a message from the exchange to any number of queues that are subscribed.  The keys are normally dot notated and wild cards of `*` (can substitute for exactly one word) and `#` (can substitute for zero or more words).  Keys can look like `vineyard.wine-produced`, `vineyard.wine-sold`, `vineyard.*`, `vineyard.#` and etc...

##### `handler`

A `handler` is a function which contains the following arity.  Order matters.
* `message` is what was received from the bus.  The message is a JS object and not the buffer.  The original source of this object is from `payload.content`.
* `ack([option, [callback]])` is a function for acknowledging the message off the bus.
 * `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
 * `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**
* `reject([option, [callback]])` is a function for rejecting the message off the bus to a predefined error queue.  The error queue is named by default `<your queue name>_error`.  It will also short circuit to `error_bus` when defaults can't be found.
 * `option` - a placeholder for future optional parameters for `ack`.  High chance of deprecation.
 * `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**
* `requeue([callback])` is a function for requeuing the message back to the back of the queue.  This is feature circumvents Rabbit's `nack` RPC.  `nack` natively requeues but pushes the message to the front of the queue.
 * `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

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
```

###`send(message, queue, [options, [callback]])`

Send a message directly to a queue

* `message` - the content being sent directly to specfied queue. *[string|Object|Buffer]* **Required**
* `queue` - the name of the queue. *[string]* **Required**
* `options` - optional settings. *[Object]* **Optional**
 * `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
 * `callingModule` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]*  **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();

const message = {
    // other stuff you want to send
}

bunnyBus.send(message, 'queue1', (err) => {});
```

###`get(queue, [options, [callback]])`

Pop a message directly off a queue

* `queue` - the name of the queue. *[string]* **Required**
* `options` - optional settings.  [Settings](http://www.squaremobius.net/amqp.node/channel_api.html#channel_get) are proxied through to amqplib `get`. *[Object]* **Optional**
* `callback` - node style callback `(err, result) => {}`. *[Function]* **Optional**

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
```

##Events (`EventEmitter`)

`BunnyBus` extends `EventEmitter` for emitting logs and system specific events.  Subscription to these events are optional.

* `log.info` - info level logging message.
* `log.debug` - debug level logging message.
* `log.warn` - warn level logging message.
* `log.error` - error level logging message.
* `log.fatal` - fatal level logging message.

###Examples

Logging on error events with [pino](https://github.com/pinojs/pino)
```Javascript
const BunnyBus = require('bunnybus');
const bunnyBus = new BunnyBus();
const pino = require('pino')();

bunnyBus.on('log.error', (message) => {

    pino.error(message);
});
```
