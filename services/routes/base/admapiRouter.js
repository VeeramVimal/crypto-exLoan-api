const express = require('express');
const router = express.Router();
const adminBorrowMarketRoute = require("../v1/borrow-market-admin.route");
const adminCoinConfigRoute = require("../v1/coin-config-admin.route");
const adminCollateralConfigRoute = require("../v1/collateral-config-admin.route");
const defaultRoutes = [
    {
        path: '/v1/borrowMarket',
        route: adminBorrowMarketRoute
    },
    {
        path: '/v1/coinConfig',
        route: adminCoinConfigRoute
    },
    {
        path: '/v1/collateralConfig',
        route: adminCollateralConfigRoute
    },
]
defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
module.exports = router;
