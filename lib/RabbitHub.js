var Logger = require('./Logger');

/**
 * A hub for RabbitMQ exchange,
 * including publish function, consumer listener/dispatcher,
 * accept only one exchange
 *
 * Difference between type/routingKey:
 *   - A type represente the type of message to be dispatched to scraper
 *   - A routingKey tell the queue to bind with (normally for a delayed job)
 *
 * @param {object} connection Connection to RabbitMQ
 * @param {object} config
 *
 */
function RabbitHub(connection, config) {
  this.connection = connection;
  this.config = config;
  this.queue = {};

  connection.on('error', function(err) {
    Logger('error', 'RabbitMQ connection error', 'rabbitmq');
    Logger('error', err, 'rabbitmq');
  });
}

/**
 * Check connection state, if it's ready, init the exchange
 *
 * @param {Function} callback
 */
RabbitHub.prototype.ready = function(callback) {
  this.connection.on('ready', callback);
};

/**
 * Init exchange with name
 *
 * @parma {string}   exchangeName
 * @param {Function} callback(exchange)
 */
RabbitHub.prototype.initExchange = function(exchangeName, callback) {
  this.exchange = this.connection.exchange(
    exchangeName,
    { type: 'direct' },
    callback
  );
}

/**
 * Get exchange
 *
 * @return {object}
 */
RabbitHub.prototype.getExchange = function() {
  return this.exchange;
}

/**
 * Publish a message via exchange
 *
 * @param {mixed}  message
 * @param {string} routingKey
 *
 * @return {boolean}
 */
RabbitHub.prototype.publish = function(message, type, routingKey) {
  if (this.exchange === undefined) {
    Logger('error', 'RabbitMQ exchange not available', 'rabbitmq');
    return false;
  }

  if (type === undefined) {
    Logger('warning', 'RabbitMQ a message should have a type');
  }

  routingKey = routingKey || 'default';
  this.exchange.publish(routingKey, {
    body: message,
    type: type
  });
  return true;
}

/**
 * Create a queue,
 *
 * @param {string}   name
 * @param {Function} callback(queue)
 *
 * @return {object|null}
 */
RabbitHub.prototype.createQueue = function(name, options, callback) {
  options = options || {};
  if (this.queue[name] !== undefined) {
    Logger('error', 'RabbitMQ already has a queue with name ' + name, 'rabbitmq');
    return null;
  }

  var queue = this.connection.queue(name, options, callback);

  this.queue[name] = queue;

  return queue;
}

/**
 * Get a queue by its name, if not exists, return null
 *
 * @param {string} name
 *
 * @return {object|null}
 */
RabbitHub.prototype.getQueue = function(name) {
  if (this.queue[name] === undefined) {
    Logger('error', 'RabbitMQ does not have a queue named ' + name);
    return null;
  }

  return this.queue[name];
}

/**
 * Bind a queue to the exchange with a defined routingKey
 *
 * @param {string}   queueName
 * @param {string}   routingKey
 * @param {Function} callback
 */
RabbitHub.prototype.bindQueue = function(queueName, routingKey, callback) {
  routingKey = routingKey || '';
  var queue = this.getQueue(queueName);

  queue.bind(this.exchange, routingKey, callback);
}

/**
 * Core function of this project (despite the core function should be its callback)
 * tell the queue to receive and dispatch the tasks according to message type
 *
 * @param {string}   queueName
 * @param {Function} callback
 * @param {object}   options   @TODO: may not be used
 */
RabbitHub.prototype.subscribeQueue = function(queueName, callback, options) {
  this.getQueue(queueName).subscribe(callback);
}


module.exports = RabbitHub;
