var RenrenStrategy = require('passport-renren').Strategy;

module.exports = function(app, db, passport, config) {
  // Serializer
  passport.serializeUser(function(user, done) {
    console.log('serialize user');
    done(null, user.id);
  });

  // Deserializer
  passport.deserializeUser(function(id, done) {
    console.log('deserialize user');
    // query the current user from database
    var userCollection = db.get('users');
    userCollection.findOne({ id: id }, function(err, user) {
      done(err, user);
    });
  });

  // passport renren-auth
  passport.use(new RenrenStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.renren_callback_url,
    scope: config.renren_scop
  }, function(accessToken, refreshToken, profile, done) {
    async.waterfall([
      function(callback) {
        var userCollection = db.get('users');

        userCollection.findOne({ id: profile.id }, function(err, user) {
          console.log('Found user id:' + profile.id);
          if (err) {
            callback(err);
          } else {
            callback(null, user, profile, accessToken);
          }
        })
      },
      function(user, profile, accessToken, callback) {
        var userCollection = db.get('users');
        if (user === undefined || user === null) {
          user = {
            id: profile.id,
            name: profile.name,
            accessToken: accessToken
          }
          userCollection.insert(user, function(err, doc) {
            console.log('Save user');
            if (err) {
              callback(err);
            } else {
              callback(null, user);
            }
          });
        } else {
          user.accessToken = accessToken;
          // update doc
          userCollection.update(
            { id: user.id },
            { $set: { "accessToken": accessToken }},
            function (err, doc) {
              if (err) {
                callback(err);
              } else {
                callback(null, user);
              }
            }
          )
        }

        callback(null, user);
      }
    ], function(err, user) {
      done(err, user);
    });
  }));

}

