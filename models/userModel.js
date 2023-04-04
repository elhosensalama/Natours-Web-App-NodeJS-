const mongoose = require('mongoose');
const validator = require('validator');

const bcrypt = require('bcryptjs');

// name , email, photo , password , passwordConfirm
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name.']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email.'],
        trim: true,
        unique: [true, 'This email have already signup. Please login or use anther email'],
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please enter a vaild email.'
        }
    },
    photo: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please enter a password.'],
        minlength: [8, 'password must be at least 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please enter a password.'],
        validate: {
            message: 'the password and passwordConfirm fields must be identical.',
            // This only works with .save() and .Create();
            validator: function(val) {
                return val === this.password;
            }
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre(/^find/, async function(next) {
    // this points to the current query
    this.find({ active: true });
    next();
});

userSchema.pre('save', async function(next) {
    // to work on update if password changed
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm Field
    this.passwordConfirm = undefined;
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
