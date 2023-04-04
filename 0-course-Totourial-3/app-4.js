const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

// 1) Middlewares

// Third-party Middleware
app.use(morgan('dev'));
app.use(express.json());

// Our Own Middleware
app.use((req, res, next) => {
    console.log('Hello from the middleware 👋');
    next();
});

const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8'));

// 2) Route Handlers

// Tours Handlers
const getAllTours = (req, res) => {
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
};
const getTour = (req, res) => {
    const id = +req.params.id;
    const tour = tours.find(element => element.id === id);

    // if (id > tours.length) {
    if (!tour) {
        res.status(200).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    } else {
        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    }
};
const createTour = (req, res) => {
    console.log(req.body);

    const newId = tours[tours.length - 1].id + 1;
    const newTour = {
        ...req.body,
        id: newId
    };
    tours.push(newTour);
    fs.writeFile('./dev-data/data/tours-simple.json', JSON.stringify(tours), err => {
        if (err) console.log(err);
    });
    res.status(201).json({
        stutus: 'success',
        data: {
            tour: newTour
        }
    });
};
const updateTour = (req, res) => {
    const id = +req.params.id;
    const tour = tours.find(element => element.id === id);

    // if (id > tours.length) {
    if (!tour) {
        res.status(200).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    } else {
        res.status(200).json({
            status: 'success',
            data: {
                tour: '<Updated tour here...>'
            }
        });
    }
};
const deleteTour = (req, res) => {
    const id = +req.params.id;
    const tour = tours.find(element => element.id === id);

    // if (id > tours.length) {
    if (!tour) {
        res.status(200).json({
            status: 'fail',
            message: 'Invalid ID'
        });
    } else {
        res.status(204).json();
    }
};

// Users Handlers
const getAllUsers = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};
const getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};
const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};
const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};
const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

// 3) Routes

app.route('/api/v1/tours')
    .get(getAllTours)
    .post(createTour);

app.route('/api/v1/tours/:id')
    .get(getTour)
    .patch(updateTour)
    .delete(deleteTour);

app.route('/api/v1/users')
    .get(getAllUsers)
    .post(createUser);

app.route('/api/v1/users/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

// 4) Server

const port = 8000;
app.listen(port, 'localhost', () => {
    // eslint-disable-next-line no-console
    console.log(`Listing on port ${port}...`);
});
