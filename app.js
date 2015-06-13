var fs = require('fs');
var https = require('https');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var RenrenStrategy = require('passport-renren').Strategy;
var session = require('cookie-session');
var mongo = require('mongo');
var monk = require('monk');
var async = require('async');

var config = require('./config');
var routes = require('./routes/index');

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
      maxAge: 3600000 * 7
    }
}));
app.use(passport.initialize());
app.use(passport.session());

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
if (app.get('env') === 'development') {
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

passport.serializeUser(function(user, done) {
  console.log('serialize user');
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log('deserialize user');
  // query the current user from database
  var userCollection = db.get('users');
  userCollection.findOne({ id: id }, function(err, user) {
    done(err, user);
  });
});

// passport auth
passport.use(new RenrenStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: 'https://127.0.0.1:3000/renren-auth/callback',
  scope: ['read_user_blog', 'read_user_photo', 'read_user_album', 'read_user_status']
}, function(accessToken, refreshToken, profile, done) {
  async.waterfall([
    function(callback) {
      var userCollection = db.get('users');

      userCollection.findOne({ id: profile.id }, function(err, user) {
        console.log('Found user id:' + profile.id);
        if (err) {
          callback(err);
        } else {
          callback(null, user, profile, accessToken);
        }
      })
    },
    function(user, profile, accessToken, callback) {
      var userCollection = db.get('users');
      if (user === undefined || user === null) {
        user = {
          id: profile.id,
          name: profile.name,
          accessToken: accessToken
        }
        userCollection.insert(user, function(err, doc) {
          console.log('Save user');
          if (err) {
            callback(err);
          } else {
            callback(null, user);
          }
        });
      } else {
        user.accessToken = accessToken;
        // update doc
        userCollection.update(
          { id: user.id },
          { $set: { "accessToken": accessToken }},
          function (err, doc) {
            if (err) {
              callback(err);
            } else {
              callback(null, user);
            }
          }
        )
      }

      callback(null, user);
    }
  ], function(err, user) {
    done(err, user);
  });
}));

module.exports = app;


httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./key-cert.pem')
}
https.createServer(httpsOptions, app).listen(3000, function() {
  console.log('Express server lisening on port 3000');
});
