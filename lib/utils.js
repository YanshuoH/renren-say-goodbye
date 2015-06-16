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
    return true;
  }

  Logger('error', 'The target dir: "' + dir + '" not exists');
  return false;
}
