module.exports = function(app, config, passport) {
  var path = require('path');
  var config = require('../config');
  var Request = require('../lib/Request');
  var Logger = require('../lib/Logger');
  var BlogScraper = require('../lib/BlogScraper');
  var Blog = require('../entity/Blog');
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
    var blog = {
      id: 436446958,
      type: 'TYPE_RSS',
      content: '<p>This is an example.</p><img alt="" src="http://1832.img.pp.sohu.com.cn/images/blog/2009/10/18/2/19/12512b27f11g213.jpg" border="0">',
      createTime: '2009-11-22 14:04:25:000',
      shareCount: 0,
      title: 'Wish you were here',
      accessControl: 'PUBLIC',
      viewCount: 4,
      commentCount: 0
    };
    Blog(blog, './output/blogs');
    res.send('OK');
  });
}
