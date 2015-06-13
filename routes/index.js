module.exports = function(app, config, passport) {
  var config = require('../config');
  var Request = require('../lib/Request');

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
    var options = {
      host: config.renren_api_uri,
      endpoint: config.api.blog_list,
    };

    var params = {
      access_token: req.user.accessToken,
      ownerId: req.user.id,
      pageSize: 20,
      pageNumber: 1
    };

    Request(options, 'GET', params, function(err, data) {
      console.log(err);
      console.log(JSON.parse(data));
      res.redirect('/');
    });
  });
}
