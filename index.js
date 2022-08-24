const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
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

app.use(async (req, res, next) => {
	if (req.user) {
		res.locals.user = await User.findById(req.user.id).populate('classes');
	} else {
		res.locals.user = undefined;
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
		req.permissions = 'owner';
	} else if (Array.from(res.locals.classroom.admin).some(hasId)) {
		req.permissions = 'admin';
	} else if (Array.from(res.locals.classroom.leaders).some(hasId)) {
		req.permissions = 'leader';
	} else {
		req.permissions = false;
	}
	next();
};

const isOwner = function (req, res, next) {
	if (req.permissions === 'owner') {
		next();
		return;
	} else if (req.permissions) {
		res.redirect(`/class/${req.params.id}`);
	} else {
		res.redirect(`/`);
	}
};
const isAdmin = function (req, res, next) {
	if ((req.permissions === 'owner') | (req.permissions === 'admin')) {
		next();
		return;
	} else if (req.permissions) {
		res.redirect(`/class/${req.params.id}`);
	} else {
		res.redirect(`/`);
	}
};
const isInClass = function (req, res, next) {
	if (req.permissions) {
		next();
		return;
	} else {
		res.redirect(`/`);
	}
};

const isLogedIn = function async(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
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
	const classroom = new Classroom({
		className: req.body.className,
		jobListings: [],
		owner: req.user._id,
	});
	await classroom.save();
	await User.findByIdAndUpdate(req.user.id, {
		$push: { classes: classroom.id },
	});
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
		await job.save();
		await Classroom.findByIdAndUpdate(req.params.id, {
			$push: { jobListings: job.id },
		});
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
		res.redirect('/');
	}
);

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', async (req, res) => {
	const user = new User({
		email: req.body.email,
		username: req.body.username,
		classes: [],
	});
	const newUser = await User.register(user, req.body.password);
	req.login(user, (err) => {
		if (!err) {
			res.redirect('/');
		}
	});
});

app.get('/logout', (req, res, next) => {
	req.logOut((e) => {
		next(e);
	});
	res.redirect('/');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
