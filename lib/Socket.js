// sockets.js
var socketio = require('socket.io')

module.exports.listen = function(server) {
    io = socketio.listen(server);

    io.sockets.on('connection', function(socket) {
        console.log('user connection');
    });

    return io;
}

module.exports.emit = function(type, content) {
  var io = require('../app').io;

  io.emit(type, content);
}