/**
 * 1. According to album id, call photo list api
 * 2. Iterate by page number
 * 3. Retrieve each photo by:
 *     - Parsing api response data
 *     - Getting image binary data using Request lib
 *     - Saving it locally
 *     - Generating a HTML to include description
 */
var path = require('path');
var async = require('async');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');

/**
 * PhotoScraper, iterate photo list api, retrieve data
 * Passe converted data (JSON object) to Photo entity
 *
 * @param {Object}   user      For access token and owner_id
 * @param {Object}   album     album Object
 * @param {Function} done      Fn
 */
module.exports = function(user, album, done) {
  var page = 1;

  var nextPage = true;

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.photo_list
  }

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    albumId: album.id,
    pageSize: 10
  };

  // Prepare for individual album working directory
  var albumDir = path.join(
    config.output.baseDir,
    config.output.albums,
    album.name
  );

  // Check if individual album dir exists, otherwise create one
  // We assume the base dir and album base dir is already set
  utils.checkOrCreateDir(albumDir);
  // Pre-clean directory for dev environnement
  if (process.env.NODE_ENV === 'dev') {
    utils.cleanDir(albumDir);
  }

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
        var photos = utils.parseData(data, 'photo');

        if (photos.length === 0) {
          nextPage = false;
          // Fn of this module
          done();
        } else {
          Logger('info',
            'Got ' + photos.length +
              ' photos in page ' + (page - 1) +
              ' for album: ' + album.name,
            'photo');
        }

        photos.forEach(function(photo) {
          Logger('info', photo, 'photo');
          // Photo(photo, albumDir);
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
        Logger('error', err, 'photo');
      }
    }
  );
}