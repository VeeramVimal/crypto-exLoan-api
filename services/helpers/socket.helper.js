var socket = 0;
// here socket connect
exports.SocketInit = function (socketIO) {
  socket = socketIO;
};
exports.GetSocket = function () {
  return socket;
};