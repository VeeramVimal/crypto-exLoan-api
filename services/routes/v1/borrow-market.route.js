const express = require('express');
const { borrowMarketController } = require('../../controllers');
const commonHelper = require("../../helpers/common.helper");
const router = express.Router();

router.route("/collateral_coins").get(borrowMarketController.getCollateralCoin);
router.route("/coin_spot").post(borrowMarketController.getBorrowingDetails);
router.route("/").get(borrowMarketController.getAllBorrowMarket);
router.route("/:borrowId").get(borrowMarketController.getSingleBorrowMarket);
router.route("/pairs").post(borrowMarketController.getPairsSingledetail);
module.exports = router;
