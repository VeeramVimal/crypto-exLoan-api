const express = require('express');
const commonHelper = require("../../helpers/common.helper");
const { loanConfigController } = require('../../controllers');
const router = express.Router();

router.route('/create').post(commonHelper.tokenMiddlewareAdmin, loanConfigController.createCollateral);
router.route('/coins').get(commonHelper.tokenMiddlewareAdmin, loanConfigController.getCollateralCoin);
router.route('/currencyList').get(commonHelper.tokenMiddlewareAdmin, loanConfigController.getCurrencyList);
router.route('/:collateralCoinId').get(commonHelper.tokenMiddlewareAdmin, loanConfigController.singleCollateral);;
router.route('/:collateralCoinId').patch(commonHelper.tokenMiddlewareAdmin, loanConfigController.updateCollateralCoin);
module.exports = router;