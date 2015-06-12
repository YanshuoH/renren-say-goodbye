module.exports = function(app, config, passport) {
  var config = require('../config');
  var https = require('https');

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

  app.get('/status', [requiresLogin], function(req, res) {
    console.log(req.user);
    var requestPath = '/v2/status/list?access_token=' + req.user.accessToken + '&ownerId=' + req.user.id;
    console.log('Request Path: ' + requestPath);
    var options = {
      host: config.renren_api_uri,
      path: requestPath,
      method: 'GET'
    };

    https.get(options, function(resHttps) {
      resHttps.setEncoding('utf-8');
      console.log('STATUS: ' + resHttps.statusCode);

      var output = '';
      resHttps.on('data', function(chunk) {
        output += chunk;
      });

      resHttps.on('end', function() {
        var obj = JSON.parse(output);
        console.log(obj);
        res.redirect('/');
      });

    }).on('error', function(err) {
      console.log(err);
    });
  });
}
