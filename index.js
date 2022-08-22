const express = require('express');
const ejs = require('ejs');
const path = require('path');
const { Classroom, JobListings } = require('./schemas.js');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/class/create', (req, res) => {
	res.render('create');
});

app.post('/class/create', (req, res) => {
	res.render('create');
});

app.get('/class/:id', (req, res) => {
	res.render('jobListings');
});

app.get('/class/:id/dashboard', (req, res) => {
	res.render('dashboard');
});

app.get('/class/:id/admin', (req, res) => {
	res.render('admin');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
