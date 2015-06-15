/**
 * 1. Call blog list api
 * 2. Iterate by page number
 * 3. Retrieve each blog id, call blog api
 *     - Parsing api response data
 *     - Save it as file
 *       (@TODO: either respect HTML or extract to other format)
 *
 */
var async = require('async');
var config = require('../config');
var Request = require('./Request');
var Logger = require('./Logger');
var Blog = require('../entity/Blog');

module.exports = function(user) {
  var page;
  if (process.env.NODE_ENV === 'dev') {
    page = 34;
  } else {
    page = 1;
  }

  var nextPage = true;

  var optionsModel = {
    host: config.renren_api_uri,
    endpoint: config.api.blog_list,
  };

  var paramsModel = {
    access_token: user.accessToken,
    ownerId: user.id,
    pageSize: 10,
  };

  async.whilst(
    function() {
      return nextPage;
    },
    function(callback) {
      var options = JSON.parse(JSON.stringify(optionsModel));
      var params = JSON.parse(JSON.stringify(paramsModel));
      params['pageNumber'] = page;
      Request(options, 'GET', params, function(err, data) {
        if (err) {
          callback(err);
        }

        var blogs = parseData(data);

        if (blogs.length === 0) {
          nextPage = false;
          Logger('info', 'End of blog parsing');
        } else {
          Logger('info', 'Got ' + blogs.length + ' blogs in page ' + page);
        }

        callback();
      });
      page++;
    },
    function(err) {
      if (err) {
        Logger('error', err);
      }
    }
  );

  function parseData(data) {
    // In case of Renren API returns something weired.
    try {
      var obj = JSON.parse(data.toString());
    } catch (e) {
      Logger('error', e);
    }

    if (obj.response !== undefined) {
      return obj.response;
    }

    Logger('error', 'No response in api\'s blogs list object');
    return [];
  }
}
