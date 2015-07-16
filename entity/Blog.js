/**
 * From blog object
 * Example: {
 *   id: 436446958,
 *   type: 'TYPE_RSS',
 *   content: '<p>This is an example.</p>',
 *   createTime: '2009-11-22 14:04:25:000',
 *   shareCount: 0,
 *   title: 'Wish you were here',
 *   accessControl: 'PUBLIC',
 *   viewCount: 4,
 *   commentCount: 0
 * }
 *
 * The workflow will be:
 *   1. Based in html template,
 *      write content into 2. (currently HTML format),
 *      pay attention to imgs
 *   2. Create a file with title(underscored)
 *      + timestamp(YYYY-mm-dd)
 *   @TODO: save imgs or export it to pdf or other format
 *
 */

/**
 * @param {Object} blog
 */
var fs = require('fs');
var path = require('path');
var async = require('async');
var cheerio = require('cheerio');
var config = require('../config');
var utils = require('../lib/utils');
var Logger = require('../lib/Logger');
var Request = require('../lib/Request');

/**
 * Blog saver core
 *
 * @param {Object} blog Blog JSON object from api
 * @param {string} blogsDir;
 */
var Blog = function (blog, blogsDir) {
  var filename = getFilename(blog.title, blog.createTime);

  async.waterfall([
    function(callback) {
      buildHtml(blog, blogsDir, callback);
    },
    function(html, callback) {
      fs.writeFile(
        path.join(
          blogsDir,
          filename + '.html'
        ),
        html,
        function(err) {
          if (err) {
            callback(err);
          }

          callback();
      });

    }
  ], function(err, done) {
    if (err) {
      Logger('error', err, 'blog');
    } else {
      Logger('info', 'Blog "' + blog.title + '" saved to ' + filename + '.html');
    }

  });

  /**
   * Private function to generate filename from title and timestamp
   *
   * @param {string} title
   * @param {string} createTime
   *
   * @return {string}
   */
  function getFilename(title, createTime) {
    var filename = formatDate(createTime);
    filename += '-' + title.replace(/ /g, "_");

    return filename;
  }

  /**
   * Out put from Date to 'YYYY-mm-dd'
   *
   * @param {Date} date
   *
   * @return string 'YYYY-mm-dd'
   */
  function formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }

    return [year, month, day].join('-');
  }

  /**
   * Inject blog content to build a html file
   *
   * @param {Object}  blog     Blog object
   * @param {string}  blogsDir
   *
   * @return {string} Generated HTML string
   */
  function buildHtml(blog, blogsDir, callback) {
    fs.readFile('templates/blogTemplate.html', function(err, buffer) {
      if (err) {
        Logger('error', err, 'blog');
      }

      var data = buffer.toString();
      $ = cheerio.load(data);

      // Title
      $('title').html(blog.title);
      $('#title').html(blog.title);

      // Content
      $('#content').html(blog.content);

      // Images handling
      var images = $('img');
      if (images.length > 0) {
        downloadImages(images, $, blog);
      }

      callback(null, $.html());
    })
  }

  /**
   * Download images, replace in html, images's src
   *
   * @param {Array}  images  Array of cheerio objects
   * @param {Object} $       Object of cheerio
   * @param {Object} blog    Blog object
   */
  function downloadImages(images, $, blog) {
    // Parsing every images, download it into local server
    images.each(function(index, imageNode) {
      // Only parse the image nodes with src attributes, otherwise it's useless
      if (imageNode.attribs.src !== undefined) {
        var imgUrl = imageNode.attribs.src;
        var uniqueName = new Date().getTime() + '-' + path.basename(imgUrl);
        // Run simple http request
        Request.get(imgUrl, null, function(err, data) {
          if (err) {
            Logger('error', err, 'blog');
            return;
          }

          fs.writeFile(
            path.join(
              blogsDir,
              uniqueName
            ),
            data,
            'binary',
            function(err) {
              if (err) {
                Logger(err);
                return;
              }
              Logger('info', 'Blog: ' + blog.title + ' : image ' + uniqueName + ' downloaded');
          });
        }, 'binary', true);

        // Replace img src
        $(imageNode).attr('src', uniqueName);
      }
    });
  }

}

module.exports = Blog;
