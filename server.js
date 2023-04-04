/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log(err);
    console.log(err.name, ':', err.message);
    console.log('Uncaught Exception 💥 : Shutting Down...');

    // Recommended Termination
    process.exit(1);
});

dotenv.config({
    path: './config.env'
});

const app = require('./app');

mongoose
    .connect(process.env.DATABASE_LOCAL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 8000;
const server = app.listen(port, 'localhost', () => {
    console.log(`Listing on port ${port}...`);
});

process.on('unhandledRejection', err => {
    console.log(err.name);
    console.log(err.name, ':', err.message);
    console.log('Unhandled Rejection 💥 : Shutting Down...');
    // Optional Terminating
    server.close(() => {
        process.exit(1);
    });
});
