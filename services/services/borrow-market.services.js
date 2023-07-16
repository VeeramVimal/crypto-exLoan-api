//** package imported */
const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Types;
//** collections imported */
const CollateralConfig = Mongoose.model("collateralConfig");
const Currency = Mongoose.model("Currency");
const BorrowMarket = Mongoose.model("borrowMarket");
const LoanConfig = Mongoose.model("loanConfig");
const UserWallet = Mongoose.model("UserWallet");
//** query and helper components imported */
const queryHelper = require("../helpers/query.helper");
const messageUtils = require("../helpers/messageUtils.helper");
/**
 * @description check validate
 * @param {Object} coin
 * @returns {Promise<BorrowMarket>}
 */
const isCoinTaken = async (coin) => {
    const verifyCoin = await BorrowMarket.findOne({ coin });
    return !!verifyCoin
};

/**
 * @description create a new coin borrow market
 * @param {Object} userBody
 * @returns {Promise<UserIdoForm>}
 */
const createBorrowMarketServices = async (userBody) => {
    const { coin } = userBody;
    if (await isCoinTaken(coin)) {
        throw new Error(messageUtils.ALREADY_COIN)
    }
    const coinData = await BorrowMarket.create(userBody);
    return { data: coinData, message: messageUtils.COIN_CREATE_SUCCESSFULL }
};

/**
* @description Get SinglePackage by pairs name
* @param {ObjectId<string} userId and currencyId
* @returns {Promise<User>}
*/

const getUserWalletServices = async (userId, currencyId) => {
    const userWallet = await UserWallet.findOne(
        { userId: ObjectId(userId), currencyId: ObjectId(currencyId) },
        { amount: 1, _id: 1, userId: 1, currencyId: 1, cryptoLoanHold: 1, cryptoLoanAmount: 1 });
    return userWallet;
}

const getPairServices = async (pairsBody) => {
    const { userId, currencyId } = pairsBody;
    const pair = await getUserWalletServices(userId, currencyId);
    return pair;
};

const getBorrowDetails = async (coinQuery, coinBody) => {
    const { ids, vs_currencies } = coinBody;
    if (ids) {
        const userData = await queryHelper.findoneData(Currency,
            { apiid: { $regex: ids, $options: 'i' } },
            { image: true, currencyId: 1, currencyName: 1, currencySymbol: 1, apiid: 1, _id: 0, USDvalue: 1 });
        const collateral = await queryHelper.findoneData(CollateralConfig, 
            { coin: userData.msg.currencySymbol, isMortgageable: true },
            { __v: 0, createdAt: 0, updatedAt: 0 })
        return { data: { userData: userData.msg, collateral: collateral.msg } };
    }
};

const getAllServices = async (queryLimit) => {
    const { page, limit, query } = queryLimit;
    const borrowData = await LoanConfig.aggregate([
        {
            $lookup: {
                from: 'borrowMarket',
                let: { coinName: '$coin' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$coin', '$$coinName']
                            }
                        }
                    },
                    {
                        $project: {
                            coin: 1,
                            marketCap: 1,
                            // flexibleRate: 1,
                            sevenDaysFixedRate: 1,
                            fourteenDaysFixedRate: 1,
                            thirtyDaysFixedRate: 1,
                        }
                    }
                ],
                as: 'borrowCoinDetails'
            }
        },
        { $unwind: '$borrowCoinDetails' },
        {
            $lookup: {
                from: 'Currency',
                let: { coinName: '$coin' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $cond: [{ $eq: ['$currencySymbol', '$$coinName'] }, { $ne: ['$currencySymbol', []] }, false] }
                        }
                    },
                    { $project: { image: true, currencyId: 1, currencyName: 1, currencySymbol: 1, USDvalue: 1, apiid: 1, } }
                ],
                as: 'currencies'
            }
        },
        { $unwind: '$currencies' },
        {
            $project: {
                "borrowCoinDetails": "$borrowCoinDetails",
                "currencyDetails": "$currencies"
            }
        }
    ])
    return borrowData
};

/**
 * @description Get all borrow market details
 * @param {empty} 
 * @returns {Promise<User>} ArrayOfObject
 */
const getCollateralCoinServices = async () => {
    const coins = await CollateralConfig.aggregate([
        { $match: { isMortgageable: true } },
        {
            $lookup: {
                from: 'Currency',
                let: { coinSymbol: '$coin' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $cond: [{ $eq: ['$currencySymbol', '$$coinSymbol'] },
                                { $ne: ['$currencySymbol', []] }, false]
                            }
                        }
                    },
                    { $project: { image: true, currencyId: 1, currencyName: 1, currencySymbol: 1, apiid: 1, USDvalue: 1, _id: 0 } }
                ],
                as: 'currencies'
            }
        },
        // { $unwind: '$currencies' },
        {
            $project: {
                // coin: 1,
                // "currencyDetails": "$currencies"
                __v: 0, createdAt: 0, updatedAt: 0,
            }
        }
    ]);
    return coins
}

/**
* @description Get SinglePackage by borrowId
* @param {ObjectId<string} borrowId
* @returns {Promise<User>}
*/
const getSingleServices = async (borrowId) => {
    const borrowData = await BorrowMarket.findById({ _id: ObjectId(borrowId) });
    return borrowData
};

module.exports = {
    createBorrowMarketServices,
    getCollateralCoinServices,
    getBorrowDetails,
    getAllServices,
    getSingleServices,
    getPairServices,
    getUserWalletServices
}