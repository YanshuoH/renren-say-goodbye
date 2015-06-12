var queryString = require('querystring');
var https = require('https');
/**
 * @param {Object}   options  Contains host, endpoint
 * @param {string}   method   http method
 * @param {Object}   data     POST Data or GET params
 * @param {Function} callback
 */
var Request = function(options, method, data, callback) {
  var dataString = JSON.stringify(data);

  if (method == 'GET') {
    options.endpoint += '?' + querystring.stringify(data);
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }

  var options = {
    host: options.host,
    path: options.endpoint,
    method: method,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      console.log(responseString);
      var responseObject = JSON.parse(responseString);
      done(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

module.exports = Request;