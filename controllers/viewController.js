const Tour = require('../models/tourModel');
const AppError = require('../utls/appError');
const catchAsync = require('../utls/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();
    // 2) Build template
    // 3) Render template
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const { slug } = req.params;

    const tour = await Tour.findOne({ slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('No Tour found with that name', 404));
    }

    res.status(200).render('tour', {
        title: tour.name,
        tour
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
});

exports.getAccount = catchAsync(async (req, res, next) => {
    res.status(200).render('account', {
        title: 'your account'
    });
});
