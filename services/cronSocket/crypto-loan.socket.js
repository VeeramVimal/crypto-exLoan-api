// import package
const WebSocket = require("ws");
const Config = require("../config/config");
var socket = 0;
var SOCKET_URL = Config.socketUrl && Config.socketUrl.socket_url;
// here socket connect
exports.SocketInit = function (socketIO) {
  socket = socketIO;
};
const GetSockets = () => {
    return socket;
}
exports.initialCall = async () => {
    try {
        const io = await GetSockets();
        io.on("connection", (socket) => {
            socket.on("pairResponse" , function (data) {
                // console.log("data==========", data);
            });
            socket.on("disconnect", () => {
                console.log("Socket : User disconnected");
            });
        })
    } catch (error) {
        console.log("socket inital err: ", error);
    }
};

const initialConnectInfo = async () => {
    try {
        const ws = new WebSocket(SOCKET_URL);
    } catch (error) {
        
    }
}