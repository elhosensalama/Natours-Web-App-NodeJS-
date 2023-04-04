const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.status(200).send('hello from the server side');
});

app.post('/', (req, res) => {
    res.status(200).send('New end point');
});

const port = 8000;
app.listen(port, 'localhost', () => {
    console.log(`Listing on port ${port}...`);
});
