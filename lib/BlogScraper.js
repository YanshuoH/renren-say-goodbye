/**
 * 1. Call blog list api
 * 2. Iterate by page number
 * 3. Retrieve each blog id
 *     - Parsing api response data
 *     - Save it as file (HTML)
 *     - Download images and replace src in html
 *       (@TODO: export to pdf format)
 *
 */
var path = require('path');
var async = require('async');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');
var Blog = require('../entity/Blog');

/**
 * BlogScraper, iterate blog list api, retrieve data
 * Passe converted data (JSON object) to Blog entity
 *
 * @param {Object}   user For access token and owner_id
 * @param {Function} done Fn
 */
module.exports = function(user, done) {
  var page = 1;
  if (process.env.NODE_ENV === 'dev') {
    page = 34;
  }

  var nextPage = true;

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.blog_list
  };

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    pageSize: 10,
  };

  // Prepare for blogs working directory
  var blogsDir = path.join(config.output.baseDir, config.output.blogs);

  // Check if base dir exists, otherwise create one
  utils.checkOrCreateDir(config.output.baseDir);
  // Pre-clean directory for dev environnement
  if (process.env.NODE_ENV === 'dev') {
    utils.cleanDir(blogsDir);
  }
  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(blogsDir);

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
        var blogs = utils.parseData(data, 'blog list');

        if (blogs.length === 0) {
          nextPage = false;
          Logger('info', 'End of blog parsing', 'blog');
          // Fn of this module
          done();
        } else {
          Logger('info', 'Got ' + blogs.length + ' blogs in page ' + (page - 1), 'blog');
        }

        blogs.forEach(function(blog) {
          Blog(blog, blogsDir);
        });
        callback();
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
