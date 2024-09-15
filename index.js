// index.js

const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// SQLite database connection
global.db = new sqlite3.Database('./database.db', function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log('Database connected');
        global.db.run('PRAGMA foreign_keys=ON');
    }
});

// Route for the main home page
app.get('/', (req, res) => {
    res.render('index'); // Renders index.ejs from the views folder
});

// Route for the Author Home Page
const authorRoutes = require('./routes/author');
app.use('/author', authorRoutes); // Ensure '/author' prefix is used

const readerRoutes = require('./routes/reader');
app.use('/reader', readerRoutes); // Ensure '/author' prefix is used

// Listen on port 3000
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
