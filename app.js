var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("./model/index")();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productRouter = require('./routes/products');
var dashboardRouter = require('./routes/dashboard');
var cartRouter = require('./routes/cart');
var orderRouter = require('./routes/orders');
var adminRouter = require('./routes/admin');
var paymentRouter = require('./routes/paymentTransactions');
var rozerPayRouter = require('./routes/razorpayRoutes');

const { authenticateUser } = require('./middleware/authentication'); // Assuming JWT middleware
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const { engine } = require('express-handlebars');

// Allow prototype access
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const hbs = allowInsecurePrototypeAccess(Handlebars);
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
  handlebars: hbs // Enable prototype access
}));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productRouter);
app.use('/dashboard', authenticateUser, dashboardRouter);
app.use('/cart', authenticateUser, cartRouter);
app.use('/order', authenticateUser, orderRouter);
app.use('/payment', authenticateUser, paymentRouter);
app.use('/admin', adminRouter);
app.use('/rozerPay', authenticateUser, rozerPayRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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
