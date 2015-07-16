/**
 * From Album object
 * Example: {
 *   name: "Paris",
 *   location: "Paris",
 *   id: 352209717
 *   type: "GENERAL",
 *   description: "x",
 *   createTime: "2010-02-01 16:29:03",
 *   photoCount: 120,
 *   accessControl: "PUBLIC",
 *   cover: {...},
 *   lastModifyTime: "2010-02-01 20:23:29"
 * }
 *
 * This entity will act as a middleware,
 * request photo list api using album id,
 * it will tell also how many pages should call,
 * in the language of RabbitMQ, it will publish as many message as pages
 *
 */
var path = require('path');
var Logger = require('../lib/Logger');

/**
 * Album to photo list middleware entity
 *
 * @param {Object} album
 */
var Album = function(album) {
  if (album.pageCount === 0) {
    // Nothing to do
    Logger('info', 'No photo in album ' + album.name, 'album');
    return;
  }

  var rabbitHub = require('../app').rabbitHub;
  var pageSize = 50;

  // Compute pages count
  var pagesCount = Math.floor(album.photoCount / pageSize) +
              album.photoCount % pageSize === 0 ? 0 : 1;

  for (var i = 0; i < pagesCount; i++) {
    // inject page size and page number
    album['pageSize'] = pageSize;
    album['pageNumber'] = i + 1;

    rabbitHub.publish('default', album, 'photo', { deliveryMode: 2 }, function(err) {
      if (!err) {
        Logger('log', 'A photo task successfully sent to default exchange', 'rabbitmq');
      } else {
        Logger('error', 'An error occurs when sending photo task to exchange', 'rabbitmq');
      }
    });
  }
}


/**
 * Prepare for this album's work directory
 * Check if it exists, otherwise create one.
 *
 * In dev env, the work dir will be cleaned every time this function called.
 *
 */
var handleWorkDirectory = function(album) {
  // Prepare for blogs working directory
  var albumDir = getWorkDirectory(album);

  // Check if blog dir exists, otherwise create one
  utils.checkOrCreateDir(albumDir);
}

/**
 * Get the album work directory path
 *
 * @return {string}
 */
var getWorkDirectory = function(album) {
  var dirname = [utils.formatdate(album.createTime), album.name].join('_');

  return path.join(config.output.baseDir, config.output.albums, dirname);
}

module.exports = Album;
