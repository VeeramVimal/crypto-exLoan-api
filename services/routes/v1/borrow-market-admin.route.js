const express = require('express');
const { borrowMarketController } = require('../../controllers');
const commonHelper = require("../../helpers/common.helper");
const router = express.Router();

router.route("/create").post(commonHelper.tokenMiddlewareAdmin, borrowMarketController.createBorrowCoin);

module.exports = router;