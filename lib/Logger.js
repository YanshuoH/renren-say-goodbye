var socket = require('./Socket');

/**
 * Logger to system, also transfer log message to socket
 *
 * Stricktly, you shall use the type of error, warn
 * But in this project, we want user have a vision of what happens,
 * we use console log for quasi everywhere
 * then check it in client side
 *
 *
 * @param {string}              type    Type of socket emit
 * @param {string|array|object} message Message
 */
var Logger = function(type, message) {
  if (type === 'info') {
    console.log(message);
  } else if (type === 'error') {
    console.log(message);
  } else if (type === 'warn') {
    console.log(message);
  } else if (type === 'log') {
    console.log(message);
  } else {
    console.error('Not a supported type of log: ' + type);
    console.error(message);
  }

  if (message instanceof Array) {
    message = message.toString();
  } else if (message instanceof Object) {
    message = JSON.stringify(message);
  }

  socket.emit(type, message);
}

module.exports = Logger;
