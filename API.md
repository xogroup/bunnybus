# 1.0.0 API Reference

- [bunnybus](#BunnyBus)
  
## BunnyBus

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

###`publish(message, [options, [callback]])`

Publish a message onto the bus

* `message` - the content being sent across the wire. *[string|Object]* **Required**
 * `event` - override value for the route key. The value must be supplied here or in `options.routeKey`.  The value can be `.` separated for namespacing. *[string]* **Optional.**
* `options` - optional settings.
 * `routeKey` - value for the route key to route the message with.  The value must be supplied here or in `message.event`.  The value can be `.` separated for namespacing. *[string]*  **Optional**
 * `transactionId` - value attached to the header of the message for tracing.  When one is not supplied, a random 40 character token is generated. *[string]*  **Optional**
 * `callingModule` - value attached to the header of the message to help with tracking the origination point of your application.  For applications that leverage this plugin in multiple modules, each module can supply its own module name so a message can be tracked to the creator. *[string]* **Optional**