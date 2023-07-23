const mongoose = require("mongoose");
const fs = require("fs");
const config = require("../config/config");

if (config.caPath != '') {
    const certFileBuf = fs.readFileSync(__dirname + config.caPath);
    mongoose.connect(config.dbconnection, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true, sslCA: certFileBuf }).then(() => console.log(config.dbName + " Mongo DB Connected")).catch((err) => console.error(err));
} else {
    // mongoose.connect(config.dbconnection, { useNewUrlParser: true,  useUnifiedTopology: true }).then(() => console.log(config.dbName + " Mongo DB Connected")).catch((err) => console.error(err));
    mongoose.connect(config.dbconnection, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true }).then(() => console.log(config.dbName + " Mongo DB Connected")).catch((err) => console.error(err));

};

mongoose.connection.on('connected', function () {
    // require('../cron/initial.USDTPerpetual').initialCall();
    console.log('Mongoose default connection open');
    require('../cronSocket/initialLoad').afterDbConnected();
});
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});


require("./Users");
require("./collateral-config.model");
require("./UserWallet");
require("./Currency");
require("./Transactions");
require("./Notification");
require("./UserActivity");
require("./EmailTemplate");
require("./SiteSettings");
require("./BorrowMarket.model");
require("./loan-config.model");
require("./Admin");
require("./CryptoLoanActivityLogs.model");
require("./CryptoLoanBalanceUpdation.model");
require("./CryptoLoanBorrow.model");
require("./repayment.model");
require("./Pairs");