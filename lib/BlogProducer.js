/**
 * Library for Blog, including its producer functions.
 *
 * General thoughts:
 *   Producer:
 *   - retrieve a list of blogs to be requested
 *   - wrap those blogs in rabbitmq message, publish those message
 */
var path = require('path');
var async = require('async');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');

/**
 * Producer function, iterate blog list api.
 * Objectif is to find exactly how many pages, thus a list of blogs to be consumed.
 * Publish a message per response to RabbitHub
 *
 * @param {Object}   user For access token and owner_id
 * @param {Function} done Fn
 */
var producer = function(user, done) {
  var page = 1;
  var pageSize = 100;
  var nextPage = true;

  if (process.env.NODE_ENV === 'dev') {
    page = 34;
    pageSize = 10;
  }

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.blog_list
  };

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    pageSize: pageSize,
  };


  handleWorkDirectory();

  async.whilst(
    /**
     * test function of async
     *
     * @return {boolean}  true: continue | false: break
     */
    function() {
      return nextPage;
    },
    /**
     * Fn of async
     *
     * @param {Function} callback Callback(err)
     */
    function(callback) {
      // Copy from models
      var options = JSON.parse(JSON.stringify(optionsModel));
      var params = JSON.parse(JSON.stringify(paramsModel));
      // Inject page number
      params['pageNumber'] = page;
      // Launch https request
      Request.request(options, 'GET', params, function(err, data) {
        if (err) {
          callback(err);
        }
        // Parse data to obj
        var blogs = utils.parseData(data, 'blog');

        if (blogs.length === 0) {
          nextPage = false;
          Logger('info', 'End of blog parsing', 'blog');
          // Fn of this module
          done();
        } else {
          Logger('info', 'Got ' + blogs.length + ' blogs in page ' + (page - 1), 'blog');
          Logger('log', { number: blogs.length }, 'blog_count');

          var rabbitHub = require('../app').rabbitHub;

          rabbitHub.publish('default', blogs, 'blog', { deliveryMode: 2 }, function(err) {
            if (!err) {
              Logger('log', 'A blog task successfully sent to default exchange', 'rabbitmq');
            } else {
              Logger('error', 'An error occurs when sending blog task to exchange', 'rabbitmq');
            }
            callback();
          });
        }
      }, 'utf-8');

      // Iterate page number
      page++;
    },
    /**
     * Err of async
     *
     * @param {Object} err
     */
    function(err) {
      if (err) {
        Logger('error', err, 'blog');
      }
    }
  );
}

/**
 * Prepare for blog work directory (also base work directory).
 * Check if it exists, otherwise create one.
 *
 * In dev env, the work dir will be cleaned every time this function called
 */
var handleWorkDirectory = function() {
  // Prepare for blogs working directory
  var blogsDir = getWorkDirectory();

  // Check if base dir exists, otherwise create one
  utils.checkOrCreateDir(config.output.baseDir);
  // Pre-clean directory for dev environnement
  if (process.env.NODE_ENV === 'dev') {
    utils.cleanDir(blogsDir);
  }
  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(blogsDir);
}

/**
 * Get the blog work directory
 *
 * @return {string}
 */
var getWorkDirectory = function() {
  return path.join(config.output.baseDir, config.output.blogs);
}

module.exports = {
  handleWorkDirectory: handleWorkDirectory,
  producer: producer,
  getWorkDirectory: getWorkDirectory
}
