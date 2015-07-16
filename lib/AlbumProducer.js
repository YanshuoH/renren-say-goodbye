/**
 * Library for Album (photo), including its producer functions
 *
 * General thoughts:
 *  - retrieve a list of urls of album to be requested
 *  - wrap those urls to rabbitmq message, publish those message
 *  - in dispatcher, the consumer will get those messages and re-requesting album content
 */
var path = require('path');
var async = require('async');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');

/**
 * Producer function, iterate album list api.
 * Objectif is to find exactly how many pages, thus a list of url to be consumed.
 * Publish a message per url to RabbitHub
 *
 * @param {Object}   user  For access token and owner_id
 * @param {Function} done  Fn
 */
var producer = function(user, done) {
  var page = 1;
  var pageSize = 100;
  var nextPage = true;

  if (process.env.NODE_ENV === 'dev') {
    page = 9;
    pageSize = 10;
  }

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.album_list,
  };

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    pageSize: 10,
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
        var albums = utils.parseData(data, 'album');

        if (albums.length === 0) {
          nextPage = false;
          Logger('info', 'End of album list parsing', 'album');
          // Fn of this module
          done();
        } else {
          Logger('info', 'Got ' + albums.length + ' albums in page ' + (page - 1), 'album');
          Logger('log', { number: albums.length }, 'album_count');

          var rabbitHub = require('../app').rabbitHub;

          albums.forEach(function(album) {
            // Inject user_id
            album['owner'] = user;

            rabbitHub.publish('default', album, 'album', { deliveryMode: 2 }, function(err) {
              if (!err) {
                Logger('log', 'A album task successfully sent to default exchange', 'rabbitmq');
              } else {
                Logger('error', 'An error occurs when sending album task to exchange', 'rabbitmq');
              }
            });
          });
          callback();
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
        Logger('error', err, 'album');
      }
    }
  );
}

/**
 * Prepare for albums work directory (also base work directory).
 * Check if it exists, otherwise create one.
 *
 * In dev env, the work dir will be cleaned every time this function called
 */
var handleWorkDirectory = function() {
  // Prepare for blogs working directory
  var albumDir = getWorkDirectory();

  // Check if base dir exists, otherwise create one
  utils.checkOrCreateDir(config.output.baseDir);

  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(albumDir);
}

/**
 * Get the blog work directory path
 *
 * @return {string}
 */
var getWorkDirectory = function() {
  return path.join(config.output.baseDir, config.output.albums);
}

module.exports = {
  handleWorkDirectory: handleWorkDirectory,
  producer: producer,
  getWorkDirectory: getWorkDirectory
}
