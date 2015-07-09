module.exports = function(app, config, passport) {
  var path = require('path');
  var config = require('../config');
  var Request = require('../lib/Request');
  var Logger = require('../lib/Logger');
  var BlogProducer = require('../lib/Blog');
  var BlogScraper = require('../lib/BlogScraper');
  var AlbumScraper = require('../lib/AlbumScraper');
  var Blog = require('../entity/Blog');
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
    var rabbitHub = require('../app').rabbitHub;
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
    BlogScraper(req.user, function() {
      res.send('End of Request: BlogScraper');
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

  app.get('/test/blog', function(req, res) {
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

  app.get('/test/producer', function(req, res) {
    BlogProducer.producer(req.user, function() {
      res.json({
        type: 'blog',
        status: 'finished',
        message: 'End of request: Blog Producer'
      });
    });
  });

}
