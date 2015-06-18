/**
 * @param {Object}   options  Contains host, endpoint
 * @param {string}   method   http method
 * @param {Object}   data     POST Data or GET params
 * @param {Function} callback
 */
var Request = function(options, method, data, callback) {
  var querystring = require('querystring');
  var https = require('https');
  var Logger = require('./Logger');

  var dataString = JSON.stringify(data);

  if (method == 'GET') {
    options.endpoint += '?' + querystring.stringify(data);
  }
  else {
    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }

  var options = {
    host: options.host,
    path: options.endpoint,
    method: method,
  };

  if (typeof headers !== 'undefined') {
    options['headers'] = headers;
  }

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var chunks = [];

    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      joinedChunks = chunks.join('');
      Logger('log', 'Request url: ' + req.path);
      callback(null, joinedChunks);
    });
  }).on('error', function(err) {
    if (err) {
      Logger('error', err, 'blog');
    }
    callback(err);
  });

  req.end();
}

module.exports = Request;
