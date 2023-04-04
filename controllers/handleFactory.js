const AppError = require('../utls/appError');
const APIFeatures = require('./../utls/APIFeatures');

const catchAsync = require('../utls/catchAsync');

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);

        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }
        res.status(204).send();
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(201).json({
            stutus: 'success',
            data: {
                document
            }
        });
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const document = await Model.create(req.body);

        res.status(201).json({
            stutus: 'success',
            data: {
                document
            }
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);

        if (populateOptions) query = query.populate(populateOptions);

        const document = await query;

        if (!document) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                document
            }
        });
    });

exports.getAll = Modle =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour (hack)
        let filter = {};
        if (req.params.tourId) {
            filter = {
                tour: req.params.tourId
            };
        }
        const features = new APIFeatures(Modle.find(filter), req.query);
        features
            .filter()
            .sort()
            .limitFields()
            .paginate();
        // const documents = await features.mongooseQuery.explain();
        const documents = await features.mongooseQuery;

        res.status(200).json({
            status: 'success',
            results: documents.length,
            data: {
                documents
            }
        });
    });
