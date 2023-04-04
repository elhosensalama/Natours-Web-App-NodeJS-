/* eslint-disable no-console */

const AppError = require('./../utls/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path} with value ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value for the '${Object.keys(err.keyValue)}' field with '${Object.values(
        err.keyValue
    )}' value, Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data.  ${errors.join('.  ')}`;
    return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
    return new AppError('Invalid token, Please login again!', 401);
};

const handleTokenExpiredError = () => {
    return new AppError('Your token has Expired, Please login again!', 401);
};

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // API
        console.log(err);
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // WebSite

    console.error('ERROR 💥 ', err);
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // API
        if (err.isOpertional) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // Unkown Errors 🧷
        // 1) Log Error
        console.error('ERROR 💥 ', err);
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong, Please Contact us!'
        });
    }
    // WebSite
    if (err.isOpertional) {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            message: err.message
        });
    } else {
        // Unkown Errors 🧷
        // 1) Log Error
        console.error('ERROR 💥 ', err);
        // 2) Send generic message
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            message: 'Please try again later!'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500; // Internal Server Error
    err.status = err.status || 'error'; // Internal Server Error
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = error.message || err.message;

        // MongoDB errors
        // 1) CastError
        if (err.name === 'CastError') {
            error = handleCastErrorDB(err);
        }
        // 2) MongoError (Duplicate Fields 11000)
        if (err.code === 11000) {
            error = handleDuplicateFieldsDB(err);
        }
        // 3) Mongoose Validation Error
        if (err.name === 'ValidationError') {
            error = handleValidationErrorDB(err);
        }

        // JWT Errors
        // 1) JsonWebTokenError
        if (err.name === 'JsonWebTokenError') {
            error = handleJsonWebTokenError();
        }

        // 2) TokenExpiredError
        if (err.name === 'TokenExpiredError') {
            error = handleTokenExpiredError();
        }
        sendErrorProd(error, req, res);
    }
    next();
};
