/* eslint-disable no-console */
const fs = require('fs');

const express = require('express');

const app = express();

app.use(express.json());

const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8'));

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

app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);

const port = 8000;
app.listen(port, 'localhost', () => {
    console.log(`Listing on port ${port}...`);
});
