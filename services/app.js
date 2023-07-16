const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const config = require("./config/config");

require("./model/db"); //** mongo-db connection imported */
const apiRouter = require('./routes/base/apiRouter');
const appapiRouter = require('./routes/base/appapiRouter');
const webapiRouter = require('./routes/base/webapiRouter');
const admapiRouter = require('./routes/base/admapiRouter');
const middlewareHelper = require('./helpers/middleware.helper');
const socketHelper = require('./helpers/socket.helper');

const app = express();
let port = config.port;

// view engine setup
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', port);

app.use('/api', middlewareHelper.middlewareApi, apiRouter);
app.use('/webapi', middlewareHelper.middlewareWebapi, webapiRouter);
app.use('/appapi', middlewareHelper.middlewareAppApi, appapiRouter);
app.use('/admapi', middlewareHelper.middlewareAdmapi, admapiRouter)
let server;
if (config.serverType == 'http') {
  let http = require('http');
  server = http.createServer(app);
} else {
  let https = require('https');
  server = https.createServer(config.options, app);
}
server.listen(port, () => console.log('Express started: ' + port));

const io = require("socket.io")(server, {
  serveClient: false,
  pingTimeout: 6000000,
  pingInterval: 30000,
  cookie: false,
});
socketHelper.SocketInit(io);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // next(createError(404));
  res.json({ status: false, message: 'Not found' });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;