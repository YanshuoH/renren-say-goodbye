/**
 * 1. Call album list api
 * 2. Iterate by page number
 * 3. Retrieve each album id, call photo list api
 */
var path = require('path');
var async = require('async');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');
/**
 * AlbumScraper, iterate album list api, retrieve data
 * Convert data to PhotoScraper
 *
 * @param {Object}   user For access token and owner_id
 * @param {Function} done Fn
 */
module.exports = function(user, done) {
try {
  var page = 1;

  var nextPage = true;

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.album_list,
  };

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    pageSize: 10,
  };

  // Prepare for album working directory
  var albumsDir = path.join(config.output.baseDir, config.output.albums);

  // Check if base dir exists, otherwise create one
  utils.checkOrCreateDir(config.output.baseDir);
  // Pre-clean directory for dev environnement
  if (process.env.NODE_ENV === 'dev') {
    utils.cleanDir(albumsDir);
  }
  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(albumsDir);

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
        var albums = utils.parseData(data, 'album list');

        if (albums.length === 0) {
          nextPage = false;
          Logger('info', 'End of album list parsing', 'album');
          // Fn of this module
          done();
        } else {
          Logger('info', 'Got ' + albums.length + ' albums in page ' + (page - 1), 'blog');
        }

        albums.forEach(function(album) {
          console.log(album);
          // Blog(blog, blogsDir);
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
} catch(e) {
  console.log(e);
}

}
