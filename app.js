const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utls/appError');
const errorController = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// TODO
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Setting Security http headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Implement Rate Limiting
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'to many requests from this IP, Please try again in one hour!'
});
app.use('/api', limiter);

// Get Data From body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization (NoSQL query injection)
app.use(mongoSanitize());

// Data sanitization (XSS)
app.use(xss());

// Prevent http paramter pollution
app.use(
    hpp({
        whitelist: ['difficulty', 'duration', 'maxGroupSize', 'ratingsQuantity', 'ratingsAverage', 'price']
    })
);

app.use((req, res, next) => {
    // See the Authorization header
    // console.log(req.headers);
    // console.log(req.cookies);
    next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Unhandled Routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handle Middleware
app.use(errorController);

module.exports = app;
