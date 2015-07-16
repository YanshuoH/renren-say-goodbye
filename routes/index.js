module.exports = function(app, config, passport) {
  var path = require('path');
  var config = require('../config');
  var Request = require('../lib/Request');
  var Logger = require('../lib/Logger');
  var BlogProducer = require('../lib/BlogProducer');
  var AlbumScraper = require('../lib/AlbumScraper');
  var utils = require('../lib/utils');
  var RabbitDispatcher = require('../lib/RabbitDispatcher');

  var requiresLogin = function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.status(401).send('Not authenticated');
  }

  app.get('/', function(req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect('/console');
    } else {
      res.render('index', { title: 'Express' });
    }
  });

  app.get('/console', function(req, res) {
    // When initializing the console page, active consumers by RabbitDispatcher
    res.render('console', { title: 'Console' });
  });

  // Login middleware
  app.get('/login', passport.authenticate('renren'));

  app.get('/renren-auth/callback',
    passport.authenticate(
      'renren',
      { failureRedirect: '/' }
    ),
    function(req, res) {
      console.log('ok');
      res.redirect('/console');
    }
  );

  app.get('/blogs', [requiresLogin], function(req, res) {
    BlogProducer.producer(req.user, function() {
      res.json({
        type: 'blog',
        status: 'finished',
        message: 'End of request: Blog Producer'
      });
    });
  });

  app.get('/photos', [requiresLogin], function(req, res) {
    AlbumScraper(req.user, function() {
      res.send('End of Request: AlbumScraper');
    });
  });

  app.get('/test/socket', function(req, res) {
    res.send('OK');
  });
}
