const socketHelper = require("../helpers/socket.helper");
// const cryptoLoanHelper = require("../helpers/crypto-loan.helper");
const cryptoLoanSocket = require("./crypto-loan.socket");
// require('./crypto-loan.cron');
exports.initialCall = async () => {
    require('./crypto-loan.cron');
    const io = socketHelper.GetSocket();
    // cryptoLoanHelper.SocketInit(io);
    cryptoLoanSocket.SocketInit(io);
    cryptoLoanSocket.initialCall();
}
