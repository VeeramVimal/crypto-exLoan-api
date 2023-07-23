const Config = require("../config/config");
const socketHelper = require("../helpers/socket.helper");
const middlewareHelper = require('../helpers/middleware.helper');
exports.afterDbConnected = async () => {
    const io = socketHelper.GetSocket();
    // console.log("io==hjk=========", io);
    if (Config && Config.sectionStatus && Config.sectionStatus.cryptoLoan !== "Disable") {
        // require("./predictionGame.initial")
        require("./crypto-loan.initial").initialCall();
    };

    // io.on("connection", function (socket) {
    //     console.log("connection socket==========");
    //     socket.on("pairResponse", (data) => {
    //         console.log("pairResponse data=========", data);
    //     });
    //     socket.on("disconnect", () => {
    //         console.log("Socket : User disconnected");
    //     });
    // })
}