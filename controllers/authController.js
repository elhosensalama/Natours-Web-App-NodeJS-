// const util = require('util');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/userModel');
const AppError = require('./../utls/appError');
const sendEmail = require('./../utls/email');

const catchAsync = require('../utls/catchAsync');

const makeToken = id => {
    return jwt.sign({ id }, process.env.MY_JWT_SECRET, {
        expiresIn: process.env.MY_JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = makeToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.MY_JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);

    // to remove password from output when one is created
    // like in quering users
    user.password = undefined;

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    // Sending Response
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('PLease provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Incorrect email or password!', 401));
    }

    // 3) if everything ok, send token to client
    // Sending Response
    createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    const cookieOptions = {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    };
    res.cookie('jwt', 'loggedout', cookieOptions);
    res.status(200).json({
        status: 'success'
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's not empty
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return next(new AppError('You are not logged in! Please log in to get access.', 401));

    // 2) Verification token
    const decodedToken = jwt.verify(token, process.env.MY_JWT_SECRET);
    // const decodedToken = await util.promisify(jwt.verify)(token, process.env.MY_JWT_SECRET);
    // console.log(decodedToken);

    // 3) check if user if still exists
    const user = await User.findById(decodedToken.id);

    if (!user) return next(new AppError('The user belonging to this token does no longer exist.', 401));

    // 4) check if user changed password after token is created
    if (user.passwordChangedAt) {
        const changedTimestamp = user.passwordChangedAt.getTime() / 1000;

        if (changedTimestamp > decodedToken.iat) {
            return next(new AppError('User recently changed password! Please log in again'), 401);
        }
    }

    // Grant Access to Protect Route
    req.user = user;
    res.locals.user = user;

    next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's not empty
        let token;
        if (req.cookies.jwt) {
            token = req.cookies.jwt;

            // 2) Verification token
            const decodedToken = jwt.verify(token, process.env.MY_JWT_SECRET);
            // const decodedToken = await util.promisify(jwt.verify)(token, process.env.MY_JWT_SECRET);
            // console.log(decodedToken);

            // 3) check if user if still exists
            const user = await User.findById(decodedToken.id);

            if (!user) return next();

            // 4) check if user changed password after token is created
            if (user.passwordChangedAt) {
                const changedTimestamp = user.passwordChangedAt.getTime() / 1000;

                if (changedTimestamp > decodedToken.iat) {
                    return next();
                }
            }

            // There is a logged in USER
            res.locals.user = user;
        }
        next();
    } catch (err) {
        next();
    }
};

exports.restrictTo = (...roles) => {
    return catchAsync(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
        next();
    });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new AppError('There is no user with this email address.', 404));

    // 2) Generate the random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save({
        validateBeforeSave: false
    });
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = ` Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password please ignore this message.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min).',
            message
        });
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({
            validateBeforeSave: false
        });

        return next(new AppError('there was an error sending the email, try again later!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return next(new AppError('Token is invalid or is expired', 400));

    // 2) if token has not expired,, and there is user, set the new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // 3) Update passwordChangedAt property for the user
    user.passwordChangedAt = Date.now() - 1000;

    await user.save();

    // 4) Log the user in, send JWT
    // Sending Response
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');
    // 2) Check if POSTed current password is correct

    if (!req.body.currentPassword) {
        return next(new AppError('Please enter your currentPassword!', 401));
    }
    const correct = await bcrypt.compare(req.body.currentPassword, user.password);

    if (!correct) {
        return next(new AppError('the current password is not correct', 400));
    }

    // 3) if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordChangedAt = Date.now() - 1000;

    await user.save();

    // 4) Log user in, send JWT
    // Sending Response
    createSendToken(user, 200, res);
});
