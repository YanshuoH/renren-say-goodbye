var async = require('async');
var Logger = require('./Logger');
var Blog = require('../entity/Blog');
var Album = require('../entity/Album');
var BlogProducer = require('../lib/BlogProducer');
var AlbumProducer = require('../lib/AlbumProducer');
var PhotoProducer = require('../lib/PhotoProducer');
/**
 * Workflow control for RabbitHub, more like a library of functions
 *
 * Usage implemented:
 *  - A helper for setting up rabbitmq working environnement (exchange, queue, binding)
 *  - A helper for create and along bind the queue to the hub's exchange
 */


/**
 * Handle the initial setup of RabbitHub
 *
 * @param {object}   rabbitHub
 * @param {object}   options
 *     properties: [exchangeName, queueName, routingKey, queueOptions]
 * @param {Function} callback(err)
 */
var setUpRabbitHub = function(rabbitHub, options, callback) {
  options = optionsChecker(options);

  async.waterfall([
    function(callback) {
      rabbitHub.ready(function() {
        Logger('log', 'RabbitMQ connection is ready', 'rabbitmq');
        callback(null);
      });
    },
    // When connection ready, init an exchange
    function(callback) {
      rabbitHub.initExchange(options.exchangeName, function(exchange) {
        Logger('log', 'RabbitMQ exchange: ' + exchange.name + ' is open');
        rabbitHub.exchange = exchange;
        callback(null);
      });
    },
    // Create and bind a queue to hub
    function(callback) {
      createAndBind(rabbitHub, options, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    },
  ], callback);
};

/**
 * Create a queue within a Hub (exchange)
 *
 * @param {object}   rabbitHub
 * @param {object}   options
 *     properties: [exchangeName, queueName, routingKey, queueOptions]
 * @param {Function} callback(err)
 */
var createAndBind = function(rabbitHub, options, callback) {
  options = optionsChecker(options);

  async.waterfall([
    // Create a queue
    function(cb) {
      rabbitHub.createQueue(options.queueName, options.queueOptions, function(queue) {
        Logger('log', 'RabbitMQ queue ' + queue.name + ' created', 'rabbitmq');
        cb(null);
      });
    },
    // Bind it to the hub's exchange with defined routingKey
    function(cb) {
      rabbitHub.bindQueue(options.queueName, options.routingKey, function() {
        Logger('log', 'RabbitMQ queue ' + options.queueName + ' binded to routingKey ' + options.routingKey);
        cb(null);
      });
    }
  ], callback);
}

/**
 * Check unified options format
 *
 * @param {object} options
 *     properties: [exchangeName, queueName, routingKey, queueOptions]
 *
 * return {object}
 */
var optionsChecker = function(options) {
  options = options || {};

  options.exchangeName = options.exchangeName !== undefined ? options.exchangeName: 'renren-exchange';
  options.queueName = options.queueName !== undefined ? options.queueName : 'default';
  options.routingKey = options.routingKey !== undefined ? options.routingKey : 'default';
  options.queueOptions = options.queueOptions !== undefined ? options.queueOptions : {};

  return options;
}

var initConsumer = function(rabbitHub, options) {
  rabbitHub.subscribeQueue('current', function(message, headers, deliveryInfo, messageObject) {
    if (message.type === undefined) {
      Logger('error', 'A message should have a type', 'rabbitmq');
    }
    switch(message.type) {
      case 'blog':
        message.body.forEach(function(blog) {
          Blog(blog, BlogProducer.getWorkDirectory());
        });
        break;
      case 'album':
        Album(message.body, AlbumProducer.getWorkDirectory());
        break;
      case 'photo':
        console.log(message.body);
        try {
          PhotoProducer.producer(message.body);
        } catch (e) {
          console.log(e.stack);
        }
        break;
      default:
        Logger('warning', 'Message type ' + message.type + ' not supported', 'rabbitmq');
    }
  });
  Logger('log', 'RabbitMQ init consumer done', 'rabbitmq');
}

module.exports = {
  setup: setUpRabbitHub,
  createAndBind: createAndBind,
  initConsumer: initConsumer
};
