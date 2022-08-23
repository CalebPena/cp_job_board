const express = require('express');
const ejs = require('ejs');
const path = require('path');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const { Classroom, JobListing, User } = require('./schemas.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'static')));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
		cookie: {
			httpOnly: true,
			expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
			maxAge: 1000 * 60 * 60 * 24 * 7,
		},
	})
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(upload.array());
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/class/create', (req, res) => {
	res.render('create');
});

app.post('/class/create', async (req, res) => {
	const classroom = new Classroom({
		className: req.body.className,
		jobListings: [],
	});
	await classroom.save();
	res.redirect(`/class/${classroom.id}/admin`);
});

app.get('/class/:id', async (req, res) => {
	const classroom = await Classroom.findById(req.params.id).populate(
		'jobListings'
	);
	const jobs = classroom.jobListings;
	res.render('jobListings', { id: req.params.id, jobs: jobs });
});

app.get('/class/:id/create', (req, res) => {
	res.render('createJob', { id: req.params.id });
});

app.post('/class/:id/create', async (req, res) => {
	console.log(req.body);
	const job = new JobListing(req.body);
	await job.save();
	await Classroom.findByIdAndUpdate(req.params.id, {
		$push: { jobListings: job.id },
	});
	res.redirect(`/class/${req.params.id}`);
});

app.get('/class/:id/dashboard', (req, res) => {
	res.render('dashboard', { id: req.params.id });
});

app.get('/class/:id/admin', (req, res) => {
	res.render('admin', { id: req.params.id });
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.post('/login', (req, res) => {
	res.redirect('/');
});

app.get('/register', (req, res) => {
	res.render('register');
});
app.post('/register', async (req, res) => {
	const user = new User({
		email: req.body.email,
		username: req.body.username,
	});
	const newUser = await User.register(user, req.body.password);
	res.redirect('/');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
