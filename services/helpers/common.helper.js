//** package imported */
const crypto = require("crypto");
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
const jwt = require("jsonwebtoken");
const ipInfo = require("ipinfo");
const fs = require('fs');
const path = require('path');
const queryHelper = require("./query.helper");
const config = require("../config/config");
//** db collection imported */
const UserWallet = Mongoose.model("UserWallet");
const Users = Mongoose.model("Users");
const Notification = Mongoose.model("Notification");
const Admin = Mongoose.model("Admin");
const CryptoLoanActivityLogs = Mongoose.model("CryptoLoanActivityLogs");
const CryptoLoanBalanceUpdation = Mongoose.model("CryptoLoanBalanceUpdation");
let siteDeploy = 0;
let siteDeployPG = 0;
let password = config.passPhrase;
let algorithm = config.algorithm;
let iv = config.iv;
let jwtTokenAdmin = config.jwtTokenAdmin;
let jwtTokenCustomers = config.jwtTokenCustomers;
let usdtRate = { changePer: 0, usdtType: 0, changeValue: 0 };
let usdtValues = {};

exports.getSiteDeploy = () => {
  return siteDeploy;
};

exports.mathRound = (num1, num2, type) => {
  if (type == "addition") {
    return Math.round((+num1 + +num2) * 1e12) / 1e12;
  } else if (type == "subtraction") {
    return Math.round((num1 - num2) * 1e12) / 1e12;
  } else if (type == "multiplication") {
    return Math.round(num1 * num2 * 1e12) / 1e12;
  } else if (type == "division") {
    return Math.round((num1 / num2) * 1e12) / 1e12;
  }
};

let roundValues = (exports.roundValues = (numIn, precision = 2) => {
  numIn += "";                                            // To cater to numric entries
  var sign = "";                                           // To remember the number sign
  numIn.charAt(0) == "-" && (numIn = numIn.substring(1), sign = "-"); // remove - sign & remember it
  var str = numIn.split(/[eE]/g);                        // Split numberic string at e or E
  if (str.length < 2) return sign + numIn;                   // Not an Exponent Number? Exit with orginal Num back
  var power = str[1];                                    // Get Exponent (Power) (could be + or -)

  var deciSp = 1.1.toLocaleString().substring(1, 2);  // Get Deciaml Separator
  str = str[0].split(deciSp);                        // Split the Base Number into LH and RH at the decimal point
  var baseRH = str[1] || "",                         // RH Base part. Make sure we have a RH fraction else ""
    baseLH = str[0];                               // LH base part.

  if (power >= 0) {   // ------- Positive Exponents (Process the RH Base Part)
    if (power > baseRH.length) baseRH += "0".repeat(power - baseRH.length); // Pad with "0" at RH
    baseRH = baseRH.slice(0, power) + deciSp + baseRH.slice(power);      // Insert decSep at the correct place into RH base
    if (baseRH.charAt(baseRH.length - 1) == deciSp) baseRH = baseRH.slice(0, -1); // If decSep at RH end? => remove it

  } else {         // ------- Negative exponents (Process the LH Base Part)
    num = Math.abs(power) - baseLH.length;                               // Delta necessary 0's
    if (num > 0) baseLH = "0".repeat(num) + baseLH;                       // Pad with "0" at LH
    baseLH = baseLH.slice(0, power) + deciSp + baseLH.slice(power);     // Insert "." at the correct place into LH base
    if (baseLH.charAt(0) == deciSp) baseLH = "0" + baseLH;                // If decSep at LH most? => add "0"

  }
  // Rremove leading and trailing 0's and Return the long number (with sign)
  return parseFloat(sign + (baseLH + baseRH).replace(/^0*(\d+|\d+\.\d+?)\.?0*$/, "$1")).toFixed(precision);
})
exports.userNotification = async function (userId, content, content1) {
  return true;
  const userlogdata = { userId: userId, content: content, content1: content1 };
  userAppPushNotification(userId, content1);
  await query_helper.insertData(Notification, userlogdata);
  return true;
};

exports.activity = function (req) {
  let ua = req.headers["user-agent"];
  ua = ua.toLowerCase();
  let browser = "";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/msie/i.test(ua)) browser = "msie";
  else browser = "unknown";

  let ip = "";
  if (req != "") {
    ip =
      typeof req.headers["x-forwarded-for"] == "string"
        ? req.headers["x-forwarded-for"]
        : typeof req.headers["cf-connecting-ip"] == "string"
          ? req.headers["cf-connecting-ip"]
          : "";
  }
  return { ip: ip, browser: browser };
};

exports.getbalance = async function (userId, currencyId) {
  let resdata1 = await queryHelper.findoneData(
    UserWallet,
    {
      userId: Mongoose.mongo.ObjectId(userId),
      currencyId: Mongoose.mongo.ObjectId(currencyId),
    },
    {}
  );
  if (resdata1.status) {
    return resdata1.msg;
  } else {
    const createWallet = {
      userId: Mongoose.mongo.ObjectId(userId),
      currencyId: Mongoose.mongo.ObjectId(currencyId),
      amount: 0,
      hold: 0,
      p2pAmount: 0,
      p2pHold: 0,
      perpetualAmount: 0,
      perpetualHold: 0,
    };
    await queryHelper.insertData(UserWallet, createWallet);
    return createWallet;
  }
};

exports.tokenMiddlewareAdmin = async function (request, res, next) {
  if (!request.headers.authorization) {
    return res.status(401).send("unauthorized");
  }
  let token = request.headers.authorization.split(" ")[1];
  if (token === "null") {
    return res.status(401).send("unauthorized");
  } else {
    let payload = jwt.verify(token, jwtTokenAdmin);
    if (!payload) {
      return res.status(401).send("unauthorized");
    }
    const userData = await queryHelper.findoneData(
      Admin,
      { _id: Mongoose.Types.ObjectId(payload.subject), status: 1 },
      {}
    );
    if (userData.status) {
      request.userId = payload.subject;
      next();
    } else {
      return res.status(401).send("unauthorized");
    }
  }
};
exports.tokenMiddlewareCustomers = async (request, res, next) => {
  try {
    if (!request.headers.authorization) {
      return res.status(401).json({ status: false, message: "unauthorized" });
    }
    let token = request.headers.authorization.split(" ")[1];
    if (token === "null") {
      return res.status(401).json({ status: false, message: "unauthorized" });
    } else {
      let payload = jwt.verify(token, jwtTokenCustomers);
      if (!payload) {
        return res.status(401).json({ status: false, message: "unauthorized" });
      }
      const userData = await queryHelper.findoneData(
        Users,
        {
          _id: Mongoose.Types.ObjectId(payload.subject),
          status: 1,
          securityKey: payload.securityKey,
        },
        {}
      );
      if (userData.status) {
        if (userData.msg.status === 0) {
          return res
            .status(401)
            .json({
              status: false,
              message: "Your account is disabled by admin",
            });
        }
        request.reqUserData = userData.msg;
        request.userId = payload.subject;
        request.securityKey = payload.securityKey;
        next();
      } else {
        return res.status(401).json({ status: false, message: "unauthorized" });
      }
    }
  } catch (e) {
    console.log("tokenMiddlewareCustomers", e, request.headers.authorization);
    return res.status(401).json({ status: false, message: "unauthorized" });
  }
};

exports.userNotify = async function (data = {}) {
};

exports.updateUserBalance = async function (
  userId,
  currencyId,
  amount,
  lastId,
  type,
  extdata = {}
) {
  const userWalletFindData = {
    userId: Mongoose.mongo.ObjectId(userId),
    currencyId: Mongoose.mongo.ObjectId(currencyId),
  }
  const wallet_data = await queryHelper.findoneData(
    UserWallet,
    userWalletFindData,
    {}
  );
  let balance = 0;
  if (wallet_data.status && wallet_data.msg) {
    if (type == 'p2pWallet') {
      balance = wallet_data.msg.p2pAmount;
    } else if (type == 'usdmWallet') {
      balance = wallet_data.msg.perpetualAmount;
    } else {
      balance = wallet_data.msg.amount;
    }
  } else {
    let createwallet = {
      userId: Mongoose.mongo.ObjectId(userId),
      currencyId: Mongoose.mongo.ObjectId(currencyId),
      p2pAmount: 0,
      p2pHold: 0,
      perpetualAmount: 0,
      perpetualHold: 0,
      amount: 0,
      hold: 0,
    };
    await queryHelper.insertData(UserWallet, createwallet);
    balance = 0;
  }

  const updations = {
    userId: Mongoose.mongo.ObjectId(userId),
    currencyId: Mongoose.mongo.ObjectId(currencyId),
    amount: roundValues(amount, 8),
    difference: roundValues(amount - balance, 8),
    oldBalance: roundValues(balance, 8),
    lastId: lastId,
    type: type,
    notes: extdata.notes ? JSON.stringify(extdata.notes) : "",
  };
  let balanceId;
  let balanceUpdColl;

  if (type == 'p2pWallet') {
    balanceUpdColl = P2PBalanceUpdation;
  } else if (type == 'usdmWallet') {
    balanceUpdColl = USDMBalanceUpdation;
  } else {
    balanceUpdColl = BalanceUpdation;
  }

  balanceId = await queryHelper.insertData(balanceUpdColl, updations);

  let updBalData = {}
  if (type == 'p2pWallet') {
    updBalData = { p2pAmount: +roundValues(+amount, 8) };
  } else if (type == 'usdmWallet') {
    updBalData = { perpetualAmount: +roundValues(+amount, 8) };
  }
  else {
    updBalData = { amount: +roundValues(+amount, 8) };
  }

  await queryHelper.updateData(
    UserWallet,
    "one",
    userWalletFindData,
    updBalData
  );

  // if (balance < 0) {
  //   let email_data = await query_helper.findoneData(emailTemplate, { hint: 'negative-hold-issue' }, {})
  //   if (email_data.status) {
  //     const userResult = await query_helper.findoneData(Users, { "_id": Mongoose.Types.ObjectId(userId) }, {});
  //     if (userResult.status) {
  //       email_data = email_data.msg;
  //       let emailtemplate = email_data.content.replace(/###USER###/g, userResult.msg.username).replace(/###BALANCE###/g, balance);
  //       mail_helper.sendMail({ subject: email_data.subject, to: 'test@yopmail.com', html: emailtemplate }, (aftermail) => {
  //       })
  //     }
  //   }
  // }

  if (balanceId && balanceId.msg && balanceId.msg._id) {
    return balanceId.msg._id;
    // return updations;
  }
  else {
    return false;
  }
};

/**
 * @description create a new crypto loan balance updation 
 * @param {Object} cryptoLoanBalanceBody
 * @returns {Promise<CryptoLoanBalanceUpdation>}
 */
exports.cryptoLoanCollateralBalance = async (
  userId,
  currencyId,
  amount,
  balance,
  lastId,
  type
) => {
  //** crypto-loan-balance-updation db will be created here */
  const balanceUpdations = {
    userId: userId,
    currencyId: Mongoose.mongo.ObjectId(currencyId),
    amount: roundValues(amount, 8),
    difference: roundValues(amount - balance, 8),
    oldBalance: roundValues(balance, 8),
    lastId: lastId,
    type: type,
  };
  //** crypto loan balance created */ 
  const CryptoBalance = await CryptoLoanBalanceUpdation.create(balanceUpdations);
  return CryptoBalance;
};


exports.cryptoLoanBorrowBalance = async (
  userId,
  currencyId,
  amount,
  balance,
  lastId,
  type
) => {

  //** crypto-loan-balance-updation db will be created here */
  const balanceUpdations = {
    userId: userId,
    currencyId: Mongoose.mongo.ObjectId(currencyId),
    amount: roundValues(amount, 8),
    difference: roundValues(amount - balance, 8),
    oldBalance: roundValues(balance, 8),
    lastId: lastId,
    type: type,
  };
  console.log("balanceUpdations==============", balanceUpdations);
  //** crypto loan balance created */ 
  const CryptoBalance = await CryptoLoanBalanceUpdation.create(balanceUpdations);
  return CryptoBalance;
};

exports.loanActivityLogs = async (
  userId,
  ownerId,
  orderNo,
  orderId,
  typelog,
  commentlog
) => {
  const loanActivityData = {
    userId: userId,
    ownerId: ownerId,
    orderNo: orderNo,
    orderId: orderId,
    type: typelog,
    comment: commentlog
  };
  await queryHelper.insertData(CryptoLoanActivityLogs, loanActivityData);
  return true;
};
