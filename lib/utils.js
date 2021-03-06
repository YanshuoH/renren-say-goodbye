var fs = require('fs');
var path = require('path');
var Logger = require('./Logger');

/**
 * Recursively clean a directory
 *
 * @param {string} dir
 *
 * @return {boolean}
 */
module.exports.cleanDir = function(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function(fileName) {
      var filePath = path.join(dir, fileName);
      if (fs.statSync(filePath).isDirectory()) {
        module.exports.cleanDir(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });

    fs.rmdirSync(dir);

    Logger('log', 'Clean : ' + dir);
  }

  Logger('log', 'Clean: The target dir: "' + dir + '" not exists');
}

/**
 * Check if defined dir exists
 *
 * @param {string} dir
 *
 * @return {boolean}
 */
module.exports.checkDir = function(dir) {
  return fs.existsSync(dir);
}

/**
 * Check or create a dir
 *
 * @param {string} dir
 *
 */
module.exports.checkOrCreateDir = function(dir) {
  if (!module.exports.checkDir(dir)) {
    fs.mkdirSync(dir);
  }
}

/**
 * Parse plat string(buffer) data to JS Object
 *
 * @param {string|buffer} data
 *
 * @return {array} specific to list api, api.response is type of array
 */
module.exports.parseData = function(data, category) {
    // In case of Renren API returns something weired.
    try {
      var obj = JSON.parse(data.toString());
    } catch (e) {
      Logger('error', e, category);
    }

    if (obj !== undefined && obj && obj.response !== undefined) {
      return obj.response;
    }

    if (obj !== undefined && obj && obj.error !== undefined) {
      Logger('error', obj.error, category);
      return [];
    }

    Logger('error', 'No response in ' + category + ' api object', category);
    return [];
}


/**
 * Out put from Date to 'YYYY-mm-dd'
 *
 * @param {string} date
 *
 * @return string 'YYYY-mm-dd'
 */
module.exports.formatDate = function(date) {
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
