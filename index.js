const express = require('express');
const ejs = require('ejs');
const engine = require('ejs-mate');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const { Classroom, JobListing, User } = require('./schemas.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
require('dotenv').config();

const app = express();

app.engine('ejs', engine);
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
		store: new MongoDBStore({
			url: 'mongodb://localhost:27017/cp_job_listings',
			collection: 'mySessions',
			expires: 7 * 24 * 60 * 60,
		}),
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

app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

app.use(async (req, res, next) => {
	if (req.user) {
		res.locals.user = await User.findById(req.user.id).populate('classes');
	} else {
		res.locals.user = false;
	}
	next();
});

const permissions = async function (req, res, next) {
	const classId = req.params.id;
	const userId = req.user.id;
	const hasId = (element) => {
		return element.id === userId;
	};
	res.locals.classroom = await Classroom.findById(classId)
		.populate('leaders')
		.populate('admin')
		.populate('owner');
	if (res.locals.classroom.owner.id === userId) {
		req.user.permissions = 'owner';
	} else if (Array.from(res.locals.classroom.admin).some(hasId)) {
		req.user.permissions = 'admin';
	} else if (Array.from(res.locals.classroom.leaders).some(hasId)) {
		req.user.permissions = 'leader';
	} else {
		req.user.permissions = false;
	}
	next();
};

const isOwner = function (req, res, next) {
	if (req.user.permissions === 'owner') {
		next();
		return;
	} else if (req.user.permissions) {
		req.flash('error', 'You do not have access to this page');
		res.redirect(`/class/${req.params.id}`);
	} else {
		req.flash('error', 'You are not in this class');
		res.redirect(`/`);
	}
};
const isAdmin = function (req, res, next) {
	if ((req.user.permissions === 'owner') | (req.user.permissions === 'admin')) {
		next();
		return;
	} else if (req.user.permissions) {
		req.flash('error', 'You do not have access to this page');
		res.redirect(`/class/${req.params.id}`);
	} else {
		req.flash('error', 'You are not in this class');
		res.redirect(`/`);
	}
};
const isInClass = function (req, res, next) {
	if (req.user.permissions) {
		next();
		return;
	} else {
		req.flash('error', 'You are not in this class');
		res.redirect(`/`);
	}
};

const isLogedIn = function async(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		req.flash('error', 'You must be logged in');
		res.redirect('/login');
	}
};

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/class/create', isLogedIn, (req, res) => {
	res.render('create');
});

app.post('/class/create', isLogedIn, async (req, res) => {
	const classCode = Math.random().toString(36).substring(2, 8);
	const classroom = new Classroom({
		className: req.body.className,
		jobListings: [],
		owner: req.user._id,
		classCode: classCode,
	});
	await classroom.save();
	await User.findByIdAndUpdate(req.user.id, {
		$push: { classes: classroom.id },
	});
	req.flash('success', 'Created new classroom');
	res.redirect(`/class/${classroom.id}/admin`);
});

app.get('/class/:id', isLogedIn, permissions, isInClass, async (req, res) => {
	const classroom = await Classroom.findById(req.params.id).populate(
		'jobListings'
	);
	const jobs = classroom.jobListings;
	res.render('jobListings', { id: req.params.id, jobs: jobs });
});

app.get('/class/:id/create', isLogedIn, permissions, isAdmin, (req, res) => {
	res.render('createJob', { id: req.params.id });
});

app.post(
	'/class/:id/create',
	isLogedIn,
	permissions,
	isAdmin,
	async (req, res) => {
		const job = new JobListing(req.body);
		job.interested = [];
		await job.save();
		await Classroom.findByIdAndUpdate(req.params.id, {
			$push: { jobListings: job.id },
		});
		req.flash('success', 'Successfully added new job listing');
		res.redirect(`/class/${req.params.id}`);
	}
);

app.get('/class/:id/dashboard', isLogedIn, permissions, isAdmin, (req, res) => {
	res.render('dashboard', { id: req.params.id });
});

app.get('/class/:id/admin', isLogedIn, permissions, isAdmin, (req, res) => {
	res.render('admin', { id: req.params.id });
});

app.post(
	'/class/:id/admin/add-admin',
	isLogedIn,
	permissions,
	isOwner,
	async (req, res) => {
		const username = req.body.username;
		const newAdmin = await User.findOneAndUpdate(
			{ username: username },
			{ $push: { classes: res.locals.classroom.id } }
		);
		await Classroom.findByIdAndUpdate(req.params.id, {
			$push: { admin: newAdmin.id },
		});
		req.flash('success', `Added new admin: ${username}`);
		res.redirect(`/class/${req.params.id}/admin`);
	}
);

app.post(
	'/class/:id/admin/add-leader',
	isLogedIn,
	permissions,
	isAdmin,
	async (req, res) => {
		if (!Array.isArray(req.body.usernames)) {
			req.body.usernames = [req.body.usernames];
		}
		if (!Array.isArray(req.body.emails)) {
			req.body.emails = [req.body.emails];
		}
		for (i = 0; i < req.body.usernames.length; i++) {
			const user = new User({
				email: req.body.emails[i],
				username: req.body.usernames[i],
				classes: [req.params.id],
			});
			const newUser = await User.register(user, req.body.password);
			await res.locals.classroom.leaders.push(newUser.id);
			res.locals.classroom.save();
		}
		req.flash('success', 'Added new lesers');
		res.redirect(`/class/${req.params.id}/admin`);
	}
);

app.get('/login', (req, res) => {
	res.render('login');
});

app.post(
	'/login',
	passport.authenticate('local', {
		failureFlash: true,
		failureRedirect: '/login',
	}),
	(req, res) => {
		req.flash('success', `Welcome, ${req.user.username}`);
		res.redirect('/');
	}
);

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', async (req, res) => {
	try {
		const user = new User({
			email: req.body.email,
			username: req.body.username,
			classes: [],
		});
		const newUser = await User.register(user, req.body.password);
		req.login(user, (err) => {
			if (!err) {
				req.flash('success', `Welcome, ${req.user.username}`);
				res.redirect('/');
			}
		});
	} catch (e) {
		req.flash('error', e.message);
		res.redirect('/register');
	}
});

app.get('/logout', (req, res, next) => {
	req.logOut((e) => {
		if (e) {
			return next(e);
		}
		req.flash('success', 'Logout complete');
		res.redirect('/');
	});
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
