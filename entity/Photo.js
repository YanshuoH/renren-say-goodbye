/**
 * From photo object
 *
 * Example: {
 *   id: 2655699815,
 *   description: "y",
 *   createTime: "2010-02-01 12:23:29",
 *   images: [
 *     {
 *       size: "LARGE",
 *       url: "..."
 *     },
 *     {...},
 *     ...
 *   ],
 *   albumId: 352209717,
 *   viewCount: 24,
 *   commentCount: 0,
 *   ownerId: 306621801
 * }
 *
 * The workflow will be:
 *   1. Request the size "LARGE" url, save binary image
 *   2. Save a image to template HTML for the correspondant comments
 *
 */
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var utils = require('../lib/utils');
var Request = require('../lib/Request');
var Logger = require('../lib/Logger');

/**
 * Photo saver core
 *
 * @param {Object} photo Photo JSON object from api
 * @param {string} photoDir
 *
 */
var Photo = function(photo, photoDir) {
  var filename = getFilename(photo);

  downloadImage(photo.images[0].url, filename, photoDir);

  buildHtml(photo, filename, photoDir);
}

/**
 * Download image to local
 *
 * @param {string} url      Url of image
 * @param {string} filename
 * @parma {string} photoDir Work directory
 */
var downloadImage = function(url, filename, photoDir) {
  Request.get(url, null, function(err, data) {
    if (err) {
      Logger('error', err, 'photo');
      return;
    }

    console.log(photoDir);
    console.log(filename);
    fs.writeFile(
      path.join(photoDir, filename),
      data,
      'binary',
      function(err) {
        if (err) {
          Logger('error', err, 'photo');
          return;
        }

        Logger('info', 'Photo: ' + filename + ' saved');
      }
    );
  }, 'binary', true);
}

var buildHtml = function (photo, photoFilename, photoDir) {
  fs.readFile('templates/photoTemplate.html', function(err, buffer) {
    if (err) {
      Logger('err', err, 'photo');
      return;

      var data = buffer.toString();
      $ = cheerio.load(data);

      if (photo.description && photo.description !== '') {
        $('#comment').html(photo.description);
      }

      $('#photo').attr('src', photoFilename);

      fs.writeFile(
        path.join(photoDir, getBasename(photo)) + '.html',
        $.html(),
        function(err) {
          if (err) {
            Logger('error', err, 'photo');
          } else {
            Logger('info', 'Photo with description "' + getBasename(photo) + '" saved');
          }
        }
      );
    }
  });
}

/**
 * Generate a base filename (without extension name) for photo
 *
 * @param {Object} photo
 *
 * @return {string}
 */
var getBasename = function(photo) {
  var filename = [utils.formatDate(photo.createTime), photo.id].join('_');

  return filename;
}

/**
 * Generate full filename (with extension) for photo
 *
 * @param {Object} photo
 *
 * @return {string}
 */
var getFilename = function(photo) {
  var extension = path.extname(photo.images[0].url);

  return getBasename(photo) + extension;
}

module.exports = Photo;
