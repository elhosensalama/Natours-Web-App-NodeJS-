const mongoose = require('mongoose');
const Tour = require('./tourModel');

// review / rating / createdAt / ref to tour / ref to user
const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!']
        },
        rating: {
            type: Number,
            default: 4.5,
            required: [true, 'Review can not be empty!'],
            min: [1, 'Review Rating must be above one!'],
            max: [5, 'Review Rating must be below five!']
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour!']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user!']
        }
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

// TODO
// Prevent Duplicated Reviews
// User can only make one review on each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // });
    // this.populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// Static methods on Model
// TODO Implement Calculating Ratings Average and Quantity
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // this points to the model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save', function() {
    // this points to document

    // this.constructor points to model
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
//                      findOneAnd
// findByIdAndDelete

reviewSchema.post(/^findOneAnd/, async function(doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
