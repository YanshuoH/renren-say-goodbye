module.exports = function(app, config, passport) {
  var config = require('../config');
  var Request = require('../lib/Request');
  var Logger = require('../lib/Logger');
  var BlogScraper = require('../lib/BlogScraper');
  var utils = require('../lib/utils');

  var requiresLogin = function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.status(401).send('Not authenticated');
  }

  app.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
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
      res.redirect('/');
    }
  );

  app.get('/blog', [requiresLogin], function(req, res) {
    BlogScraper(req.user, function() {
      res.send('End of Request: BlogScraper');
    });
  });

  app.get('/socket', function(req, res) {
    res.send('OK');
  });

  app.get('/test', function(req, res) {
    utils.cleanDir(config.output.baseDir);
    res.send('OK');
  });
}
