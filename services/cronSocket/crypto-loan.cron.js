//** package imported */
const Mongoose = require("mongoose");
const cron = require("node-cron");
//** db collection imported */
const CryptoLoanBorrowModel = Mongoose.model("cryptoLoanBorrowed");
const UserWallet = Mongoose.model("UserWallet");
const LoanRepayment = Mongoose.model("loanRepayment");
const collateralConfig = Mongoose.model("collateralConfig");
const Currency = Mongoose.model("Currency");
const Pairs = Mongoose.model("Pairs");
const LoanConfig = Mongoose.model("loanConfig");
const BorrowMarket = Mongoose.model("borrowMarket");
//** query_helper and common helper package imported */
const config = require("../config/config");
const queryHelper = require("../helpers/query.helper");
const commonHelper = require("../helpers/common.helper");
const socketHelper = require("../helpers/socket.helper");
/**
 * @description get the current market price based on pair coin
 * @param { Object }
 * @returns { Pairs }
 */
const getMarketPriceSpot = async (coinQuery) => {
    const { pair, exchangeType } = coinQuery;
    // const socket = await socketHelper.GetSocket();
    let where = pair != '' ? { exchangeType, pair, status: 1 } : { exchangeType, status: 1 };
    let pairs = await Pairs.findOne(where).sort({ _id: 1 }).populate("fromCurrency").populate("toCurrency");
    return pairs;
};

/** 
 * @description at every mins schedule for the crypto loan expired date format to using cron function checked and updating
 * @param {Object}
 * @returns {}
 */

const cryptoLoanExpirateCheck = async () => {
    try {
        var todayDate = new Date();
        const cryptoLoan = await queryHelper.findData(CryptoLoanBorrowModel, { loanStatus: 0 }, {}, {}, 0);
        if (cryptoLoan.status == true) {
            const cryptoLoanData = cryptoLoan.msg;
            if (cryptoLoanData && cryptoLoanData.length) { 
                const expiredLoanDetails = await cryptoLoanData.filter((loan) => new Date(loan.expirationDate) <= todayDate);
                if (expiredLoanDetails) {
                    expiredLoanDetails.forEach(async (loan) => {
                        let cryptoLoanId = loan._id;
                        let userId = loan.userId;
                        let borrowCurrencyId = loan.borrowCurrencyId;
                        let collateralCurrencyId = loan.collateralCurrencyId;
                        var collateralAmount = loan.collateralAmount;
                        collateralCurrencyId && (
                            UserWallet.findOne(
                                { userId: userId, currencyId: collateralCurrencyId },
                                { amount: 1, _id: 1, userId: 1, currencyId: 1, cryptoLoanHold: 1, cryptoLoanAmount: 1 })
                                .then(async (userWalletCollateralCoin) => {
                                    let oldAmount = userWalletCollateralCoin.amount; //** using crypto loan balance updation in old amount */
                                    let newAmount = userWalletCollateralCoin.cryptoLoanHold;
                                    // userWalletCollateralCoin.amount = userWalletCollateralCoin.amount - collateralAmount;
                                    // userWalletCollateralCoin.amount = userWalletCollateralCoin.cryptoLoanAmount - collateralAmount;

                                    // Update the object's properties
                                    userWalletCollateralCoin.cryptoLoanHold = 0;
                                    Object.assign(userWalletCollateralCoin);
                                    // Save the updated object
                                    await userWalletCollateralCoin.save((err, updatedObject) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log("user wallet collateral coin is automatic liquidated");
                                            newAmount = updatedObject.amount; //** using crypto loan balance updation in new amount */
                                        }
                                    });
                                    let type = "Crypto loan will automatically close the Collateral Asset to Loan Asset"
                                    await commonHelper.cryptoLoanBorrowBalance(userId, collateralCurrencyId, newAmount, oldAmount, cryptoLoanId, type);
                                }).catch((err) => console.log(err))
                        );

                        borrowCurrencyId && (
                            UserWallet.findOne(
                                { userId: userId, currencyId: borrowCurrencyId },
                                { amount: 1, _id: 1, userId: 1, currencyId: 1, cryptoLoanHold: 1, cryptoLoanAmount: 1 })
                                .then(async (userWalletBorrowCoin) => {
                                    walletData = [];
                                    if (userWalletBorrowCoin) {
                                        // userWalletBorrowCoin.amount = (userWalletBorrowCoin.amount - repay.due_detail[0].due_paid_amount);
                                        userWalletBorrowCoin.cryptoLoanHold = 0;
                                        Object.assign(userWalletBorrowCoin);
                                        await userWalletBorrowCoin.save((err, updatedObject) => {
                                            if (err) console.log(err);
                                            else console.log("user wallet borrow coin is automatic liquidated");
                                        });
                                    }
                                }).catch((err) => console.log(err))
                        );

                        if (loan) {
                            loan.collateralAmount = 0;
                            loan.remainingPrinciple = 0;
                            loan.debtLoanableAmount = loan.debtLoanableAmount;
                            loan.yearlyInterestRate = 0;
                            loan.loanStatus = 2;
                            loan.RepaidDate = new Date();
                            Object.assign(loan);
                            await loan.save();
                        }
                        return loan;
                    });
                }
            }
        }
    } catch (error) {
        console.log("err cryptoLoan expired cron: ", error);
    }
};

/** 
 * @description at every mins schedule for the crypto loan liquidating price using cron function checked and updating
 * @param {Object}
 * @returns {}
 */
const autoCloseAsset = async (cryptoLoanAutoRepaid) => {
    const { userId, borrowCurrencyId, collateralCurrencyId } = cryptoLoanAutoRepaid;
	if (collateralCurrencyId) {
		UserWallet.findOne(
			{ userId: userId, currencyId: collateralCurrencyId },
			{ amount: 1, _id: 1, userId: 1, currencyId: 1, cryptoLoanHold: 1 })
			.then(async (userWalletCollateralCoin) => {
				// Update the object's properties
				userWalletCollateralCoin.cryptoLoanHold = 0;
				Object.assign(userWalletCollateralCoin);
				// Save the updated object
				await userWalletCollateralCoin.save((err, updatedObject) => {
					if (err) console.log(err);
					else console.log("user wallet collateral coin is automatic liquidated");
				});
			}).catch((err) => console.log(err))
	}
	if (borrowCurrencyId) {
		UserWallet.findOne(
			{ userId: userId, currencyId: borrowCurrencyId },
			{ amount: 1, _id: 1, userId: 1, currencyId: 1, cryptoLoanHold: 1 })
			.then(async (userWalletBorrowCoin) => {
				walletData = [];
				if (userWalletBorrowCoin) {
					// userWalletBorrowCoin.amount = (userWalletBorrowCoin.amount - repay.due_detail[0].due_paid_amount);
					userWalletBorrowCoin.cryptoLoanHold = 0;
					Object.assign(userWalletBorrowCoin); // Update the object's properties
					await userWalletBorrowCoin.save((err, updatedObject) => {
						if (err) console.log(err);
						else console.log("user wallet borrow coin is automatic liquidated");
					}); // Save the updated object
				}
			}).catch((err) => console.log(err))
	}
	if (cryptoLoanAutoRepaid) {
		cryptoLoanAutoRepaid.collateralAmount = 0;
		cryptoLoanAutoRepaid.remainingPrinciple = 0;
		cryptoLoanAutoRepaid.debtLoanableAmount = cryptoLoanAutoRepaid.debtLoanableAmount;
		cryptoLoanAutoRepaid.yearlyInterestRate = 0;
		cryptoLoanAutoRepaid.loanStatus = 2;
		cryptoLoanAutoRepaid.RepaidDate = new Date();
		Object.assign(cryptoLoanAutoRepaid); //Update the object's properties
		await cryptoLoanAutoRepaid.save();// Save the updated object
	}
	return console.log("Automatically close your Collateral Asset to repay the loan");
}
const topUpAssetLiquidation = async () => {
    return console.log("Please top up your collateral in time to avoid closing the position.");
}
const liquidePriceCheck = async () => {
    try {
        const CryptoLoanBorrow = await queryHelper.findData(CryptoLoanBorrowModel, { loanStatus: 0 }, {}, {}, 0)
        let todayDate = new Date();
        if (CryptoLoanBorrow.status == true) {
            if (CryptoLoanBorrow.msg && CryptoLoanBorrow.msg.length) {
                let borrowData = CryptoLoanBorrow.msg;
                borrowData.forEach(async (cryptoLoan) => {
                    let collateralCoin = cryptoLoan.collateralCoin;
                    let borrowedCoin = cryptoLoan.borrowedCoin
                    let pairCoin = `${collateralCoin}_${borrowedCoin}`
                    let userId = cryptoLoan.userId;
                    let orderId = cryptoLoan._id;
                    let remainingPrinciple = cryptoLoan.remainingPrinciple;
                    let collateralAmt = cryptoLoan.collateralAmount;
                    var RepaidDate = new Date(cryptoLoan.RepaidDate);
                    var hours = parseInt(Math.abs(RepaidDate - todayDate) / 3600000);
                    var hourInterest = (hours + 1) * parseFloat(cryptoLoan.hourlyInterestRate);
                    var usdValue = null, loanAmt = null, marginLTVCalc = null, liqudateLTVCalc = null;
                    let liquidateLTV = cryptoLoan.liquidateLTV;
                    let marginLTV = cryptoLoan.marginLTV;
                    let coinQuery = {
                        pair: "",
                        exchangeType: ""
                    }
                    if (remainingPrinciple == 0 || remainingPrinciple == null) {
                        loanAmt = cryptoLoan.debtLoanableAmount;
                    } else {
                        loanAmt = cryptoLoan.remainingPrinciple;
                    }

                    collateralConfig.findOne({ coin: collateralCoin })
                        .then((collateralData) => {
                            const { initLtv, marginLtv, liquidationLtv } = collateralData;
                            LoanRepayment.findOne({ loanOrderId: orderId, userId: userId })
                                .then(async (repayment) => {
                                    Currency.findOne({ currencySymbol: { $regex: collateralCoin, $options: 'i' } },
                                        { image: true, currencyId: 1, currencyName: 1, currencySymbol: 1, apiid: 1, _id: 0, USDvalue: 1 })
                                        .then(async (currencyData) => {
                                            coinQuery.pair = pairCoin;
                                            coinQuery.exchangeType = 'SPOT';
                                            marginLTVCalc = ((loanAmt) / (collateralAmt * marginLtv));
                                            liqudateLTVCalc = ((loanAmt) / (collateralAmt * liquidationLtv));
                                            const pairData = await getMarketPriceSpot(coinQuery);
                                            var currentMarketPrice = pairData && pairData.price;
                                            if (currentMarketPrice) {
                                                if (liqudateLTVCalc >= currentMarketPrice) await autoCloseAsset(cryptoLoan);
                                                else if (marginLTVCalc >= currentMarketPrice) await topUpAssetLiquidation();
                                            }
                                        }).catch((err) => console.log(err))
                                }).catch((err) => console.log(err))
                        }).catch((err) => console.log(err))
                })
            }
        }
    } catch (error) {
        console.log("err cryptoLoan liquidate-price cron: ", error);
    }
}
if (config.sectionStatus && config.sectionStatus.cryptoLoan == "Enable") {
    //** at every mins schedule for crypto-loan expired checked and updating*/
    let cryptoLoanExpirateCheckRunning = false;
    cron.schedule("* * * * *", async (req, res) => {
        if (cryptoLoanExpirateCheckRunning) return true;
        cryptoLoanExpirateCheckRunning = true;
        await cryptoLoanExpirateCheck();
        cryptoLoanExpirateCheckRunning = false;
    });

    //** at every mins schedule for liquidation price functionalities*/
    let liquidePriceCheckRunning = false;
    cron.schedule("* * * * *", async (req, res) => {
        if (liquidePriceCheckRunning) {
            return true;
        }
        liquidePriceCheckRunning = true;
        await liquidePriceCheck();
        liquidePriceCheckRunning = false;
    });
}