const express = require('express');
const router = express.Router();
const borrowMarketRoute = require("../v1/borrow-market.route");
const cryptoLoanBorrowedRouter = require("../v1/loan-borrow.route");
const defaultRoutes = [
    {
        path: '/v1/borrowMarket',
        route: borrowMarketRoute
    },
    {
        path: '/v1/cryptoLoan',
        route: cryptoLoanBorrowedRouter
    },
]
defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
module.exports = router;
