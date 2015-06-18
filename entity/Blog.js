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
var config = require('../config');
var utils = require('../lib/utils');

/**
 * Blog saver core
 *
 * @param {Object} blog Blog JSON object from api
 * @param {string} blogsDir;
 */
var Blog = function (blog, blogsDir) {
  var fileName = getFilename(blog.title, blog.createTime);
  fs.writeFile(
    path.join(
      blogsDir,
      fileName + '.html'
    ),
    blog.content,
    function(err) {
      if (err) {
        return console.log(err);
      }

      console.log('saved');
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

}

module.exports = Blog;
