// sockets.js
var socketio = require('socket.io');

/**
 * init function for socket server
 *
 * @param  {object} server
 *
 * @return {object} io  Seperate io from server for logger
 */
module.exports.listen = function(server) {
  io = socketio.listen(server);

  io.sockets.on('connection', function(socket) {
      console.log('user connection');
  });

  return io;
}

/**
 * Emits(broadcast) a message with type
 *
 * @param {string} type
 * @param {string} content
 */
module.exports.emit = function(type, content) {
  var io = require('../app').io;

  io.emit(type, content);
}