var url = require('url');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var Logger = require('./Logger');
/**
 * @param {Object}   options  Contains host, endpoint
 * @param {string}   method   http method
 * @param {Object}   data     POST Data or GET params
 * @param {Function} callback
 * @param {boolean}  isHttp   isHttp or Https?
 */
var Request = function() {

}

/**
 * @param {string}   url      Contains host, endpoint
 * @param {Object}   data     GET params
 * @param {Function} callback
 * @param {boolean}  isHttp   isHttp or Https?
 */
Request.get = function(url, data, callback, encoding, isHttp) {
try {
  if (data) {
    var dataString = JSON.stringify(data);
    url += '?' + querystring.stringify(data);
  }

  var req = http.get(url, function(res) {
    if (encoding !== undefined) {
      res.setEncoding(encoding);
    }

    var chunks = [];

    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      joinedChunks = chunks.join('');
      callback(null, joinedChunks);
    });
  }).on('error', function(err) {
    if (err) {
      Logger('error', err, 'blog');
    }
    callback(err);
  });

} catch (e) {
  console.log(e);
}
}

/**
 * @param {Object}   options  Contains host, endpoint
 * @param {string}   method   http method
 * @param {Object}   data     POST Data or GET params
 * @param {Function} callback
 * @param {boolean}  isHttp   isHttp or Https?
 */
Request.request = function(options, method, data, callback, encoding, isHttp) {
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

  Logger('log', 'Request url: ' + url.resolve(options.host, options.path));

  var httpMode = https;
  if (isHttp !== undefined && isHttp) {
    httpMode = http;
  }

  var req = httpMode.request(options, function(res) {
    if (encoding !== undefined) {
      res.setEncoding(encoding);
    }

    var chunks = [];

    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      joinedChunks = chunks.join('');
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
