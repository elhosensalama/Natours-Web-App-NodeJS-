const User = require('../models/userModel');
const AppError = require('../utls/appError');
const catchAsync = require('../utls/catchAsync');
const factory = require('./handleFactory');

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do Not update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data.
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError('this route is not for updating password!', 400));
    // 2) Update user document
    const filteredBody = {};
    Object.keys(req.body).forEach(el => {
        if (['name', 'email'].includes(el)) filteredBody[el] = req.body[el];
    });
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        user: updatedUser
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    });
});
