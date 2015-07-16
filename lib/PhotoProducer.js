/**
 * 1. According to [album_id, pageSize, pageNumber],
 *    call photo list api
 * 2. Pass api response to photo entity
 */
var path = require('path');
var utils = require('./utils');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');
var AlbumProducer = require('../lib/AlbumProducer');
var Photo = require('../entity/Photo');

/**
 * Photo producer, request photo list api
 *
 * @param {Object} album Which contains necessary info
 */
var producer = function(album) {
  var pageNumber = album['pageNumber'];
  var pageSize = album['pageSize'];
  var user = album['owner'];

  var options = {
    host: config.renren_api_uri,
    endpoint: config.api.photo_list,
  };

  var params = {
    access_token: user.accessToken,
    ownerId: user.id,
    albumId: album.id,
    pageSize: pageSize,
    pageNumber: pageNumber
  };

  var photoDir = handleWorkDirectory(album);

  Request.request(options, 'GET', params, function(err, data) {
    if (err) {
      Logger('error', err, 'photo');
      return;
    }

    var photos = utils.parseData(data, 'photo');

    if (photos.length === 0) {
      Logger('info', 'No photo for album ' + album.name, 'photo');

      if (data.error !== undefined && data.error.code === 'internal_error.SERVICE_BUSY') {
        rabbitHub.publish('default', album, 'photo', { deliveryMode: 2 }, function(err) {
          if (!err) {
            Logger('log', 'Retry: A album task successfully sent to default exchange', 'rabbitmq');
          } else {
            Logger('error', 'An error occurs when sending album task to exchange', 'rabbitmq');
          }
        });
      }
      return;
    }

    Logger('info', 'Got ' + photos.length + ' photos in album ' + album.name + ' in page ' + pageNumber);
    Logger('log', { number: photos.length }, 'photo_count');

    photos.forEach(function(photo) {
      Photo(photo, photoDir);
    });
  }, 'utf-8');
}

/**
 * Prepare for this album's work directory
 * Check if it exists, otherwise create one.
 *
 * In dev env, the work dir will be cleaned every time this function called.
 *
 * @return {string}
 */
var handleWorkDirectory = function(album) {
  // Prepare for blogs working directory
  var albumDir = getWorkDirectory(album);

  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(albumDir);

  return albumDir;
}

/**
 * Get the album work directory path
 *
 * @return {string}
 */
var getWorkDirectory = function(album) {
  var dirname = [utils.formatDate(album.createTime), album.name].join('_');

  return path.join(config.output.baseDir, config.output.albums, dirname);
}

module.exports = {
  producer: producer
}
