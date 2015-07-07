var fs = require('fs');
var https = require('https');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('cookie-session');
var mongo = require('mongo');
var monk = require('monk');
var amqp = require('amqp');
var async = require('async');

var config = require('./config');
var routes = require('./routes/index');
var Logger = require('./lib/Logger');
var RabbitHub = require('./lib/RabbitHub');

var app = express();
var db = monk(config.db_uri);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    secret: 'whatever',
    cookie: {
      maxAge: 3600 * 24 * 7
    }
}));
app.use(passport.initialize());
app.use(passport.session());

require('./passport-auth')(app, db, passport, config);

app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// All routes here
routes(app, config, passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'dev') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// HTTPS pem keys
httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./key-cert.pem')
}

// Create server
var server = https.createServer(httpsOptions, app).listen(3000, function() {
  console.log('Express server lisening on port 3000');
});
// Initialize Socket.io
var io = require('./lib/Socket').listen(server);

// Initialize a RabbitMQ (amqp) wrapper lib
// create a stand alone event listener hub with a funny name
amqpConnection = amqp.createConnection(config.amqp);
var rabbitHub = new RabbitHub(amqpConnection, config);
// When connection ready, init an exchange
async.waterfall([
  function(callback) {
    rabbitHub.ready(function() {
      Logger('log', 'RabbitMQ connection is ready', 'rabbitmq');
      callback(null);
    });
  },
  function(callback) {
    rabbitHub.initExchange(function(exchange) {
      Logger('log', 'RabbitMQ exchange: ' + exchange.name + ' is open');
      rabbitHub.exchange = exchange;
      callback(null);
    });
  },
  function(callback) {
    rabbitHub.createQueue('default', function(queue) {
      Logger('log', 'RabbitMQ queue default created', 'rabbitmq');
      callback(null);
    });
  },
  function(callback) {
    rabbitHub.bindQueue('default', 'default', function() {
      Logger('log', 'RabbitMQ queue default binded to routingKey default');
      callback(null);
    });
  }
], function(err) {
  if (err) {
    Logger('error', err);
  }
});

module.exports.server = server;
module.exports.io = io;
module.exports.rabbitHub = rabbitHub;
