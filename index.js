const express = require('express');
const ejs = require('ejs');
const engine = require('ejs-mate');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const methodOverride = require('method-override');
const { Classroom, JobListing, User } = require('./schemas');
const {
	jobValidation,
	classroomValidation,
	userValidation,
} = require('./validations');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
const catchAsync = require('./utiles/catchAsync');
const ExpressError = require('./utiles/expressError');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'static')));

app.use(
	session({
		name: 'session',
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
app.use(mongoSanitize());
app.use(helmet());

const scriptSrcUrls = ['https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'];
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: [],
			connectSrc: ["'self'"],
			scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
			styleSrc: ["'self'", "'unsafe-inline'"],
			workerSrc: ["'self'", 'blob:'],
			childSrc: ['blob:'],
			objectSrc: [],
			imgSrc: ["'self'", 'blob:', 'data:'],
			fontSrc: ["'self'"],
		},
	})
);

app.use(methodOverride('_method'));

app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	res.locals.classroom = false;
	next();
});

app.use(
	catchAsync(async (req, res, next) => {
		if (req.user) {
			res.locals.user = await User.findById(req.user.id).populate('classes');
			res.locals.user.permissions = false;
		} else {
			res.locals.user = false;
		}
		next();
	})
);

const permissions = catchAsync(async function (req, res, next) {
	const classId = req.params.id;
	const userId = req.user.id;
	const hasId = (element) => {
		return element.id === userId;
	};
	req.classroom = await Classroom.findById(classId)
		.populate('leaders')
		.populate('admin')
		.populate('owner')
		.populate('jobListings');
	res.locals.classroom = req.classroom;
	if (req.classroom.owner.id === userId) {
		req.user.permissions = 'owner';
	} else if (Array.from(req.classroom.admin).some(hasId)) {
		req.user.permissions = 'admin';
	} else if (Array.from(req.classroom.leaders).some(hasId)) {
		req.user.permissions = 'leader';
	} else {
		req.user.permissions = false;
	}
	res.locals.user.permissions = req.user.permissions;
	next();
});

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

const isLogedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		req.flash('error', 'You must be logged in');
		res.redirect('/login');
	}
};

const validInput = function (error, next) {
	if (error) {
		const msg = error.details.map((el) => el.message).join(',');
		throw new ExpressError(msg, 400);
	} else {
		if (next) next();
	}
};
const validateClassroom = function (req, res, next) {
	const { error } = classroomValidation.validate(req.body);
	validInput(error, next);
};

const validateJob = function (req, res, next) {
	if (!Array.isArray(req.body.careerTracks))
		req.body.careerTracks = [req.body.careerTracks];
	if (!Array.isArray(req.body.tags)) req.body.tags = [req.body.tags];
	const { error } = jobValidation.validate(req.body);
	validInput(error, next);
};

const validateUser = function (obj) {
	const { error } = userValidation.validate(obj);
	validInput(error);
};

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/class/create', isLogedIn, (req, res) => {
	res.render('create');
});

app.post(
	'/class/create',
	isLogedIn,
	validateClassroom,
	catchAsync(async (req, res) => {
		let classCode = Math.random().toString(36).substring(2, 8);
		const classroom = new Classroom({
			className: req.body.className,
			jobListings: [],
			owner: req.user._id,
		});
		while (true) {
			let classWithCode = await Classroom.find({ classCode: classCode });
			if (classWithCode) break;
			classCode = Math.random().toString(36).substring(2, 8);
		}
		classroom.classCode = classCode;
		await classroom.save();
		await User.findByIdAndUpdate(req.user.id, {
			$push: { classes: classroom.id },
		});
		req.flash('success', 'Created new classroom');
		res.redirect(`/class/${classroom.id}/admin`);
	})
);

app.post(
	'/join',
	isLogedIn,
	catchAsync(async (req, res) => {
		const classroom = await Classroom.findOne({
			classCode: req.body.classCode,
		});
		if (classroom) {
			if (
				classroom.leaders.indexOf(req.user.id) === -1 &&
				classroom.admin.indexOf(req.user.id) === -1 &&
				classroom.owner != req.user.id
			) {
				classroom.leaders.push(req.user.id);
			} else {
				req.flash('error', 'You are already in this class');
				res.redirect('/');
				return;
			}
			await classroom.save();
			const user = await User.findById(req.user.id);
			user.classes.push(classroom.id);
			await user.save();
			req.flash('success', 'Joined classroom');
			res.redirect(`/class/${classroom.id}`);
		} else {
			req.flash('error', 'Wrong code');
			res.redirect('/');
		}
	})
);

app.get(
	'/class/:id',
	isLogedIn,
	permissions,
	isInClass,
	catchAsync(async (req, res) => {
		const classroom = await Classroom.findById(req.params.id)
			.populate({
				path: 'jobListings',
				populate: {
					path: 'interested',
				},
			})
			.lean();
		let jobs = classroom.jobListings;
		for (i = 0; i < jobs.length; i++) {
			if (jobs[i].interested.some((u) => u._id == req.user.id)) {
				jobs[i].userIsInterested = true;
			} else {
				jobs[i].userIsInterested = false;
			}
			jobs[i].id = String(jobs[i]._id);
		}
		res.render('jobListings', { id: req.params.id, jobs: jobs });
	})
);

app.get(
	'/class/:id/jobs',
	isLogedIn,
	permissions,
	isInClass,
	catchAsync(async (req, res) => {
		let classroom = await Classroom.findById(req.params.id)
			.populate('jobListings')
			.lean();
		classroom.jobListings.forEach((job) => {
			delete job.interested;
		});
		res.json(classroom.jobListings);
	})
);

app.get('/class/:id/create', isLogedIn, permissions, isAdmin, (req, res) => {
	res.render('createJob', { id: req.params.id });
});

app.post(
	'/class/:id/create',
	isLogedIn,
	permissions,
	isAdmin,
	validateJob,
	catchAsync(async (req, res) => {
		const job = new JobListing(req.body);
		job.interested = [];
		await job.save();
		await Classroom.findByIdAndUpdate(req.params.id, {
			$push: { jobListings: job.id },
		});
		req.flash('success', 'Successfully added new job listing');
		res.redirect(`/class/${req.params.id}`);
	})
);

app.get('/class/:id/admin', isLogedIn, permissions, isAdmin, (req, res) => {
	res.render('admin', {
		id: req.params.id,
		admin: req.classroom.admin,
		leaders: req.classroom.leaders,
	});
});

app.post(
	'/class/:id/admin/add-admin',
	isLogedIn,
	permissions,
	isOwner,
	catchAsync(async (req, res) => {
		const username = req.body.username;
		const newAdmin = await User.findOneAndUpdate(
			{ username: username },
			{ $push: { classes: req.classroom.id } }
		);
		try {
			await Classroom.findByIdAndUpdate(req.params.id, {
				$addToSet: { admin: newAdmin.id },
			});
		} catch (err) {
			req.flash('error', `Failed to add Admin`);
			res.redirect(`/class/${req.params.id}/admin`);
			return;
		}
		req.flash('success', `Added new admin: ${username}`);
		res.redirect(`/class/${req.params.id}/admin`);
	})
);

app.delete(
	'/class/:id/admin/admin/:adminId',
	isLogedIn,
	permissions,
	isOwner,
	catchAsync(async (req, res) => {
		req.classroom.admin = req.classroom.admin.filter(function (ele) {
			return ele.id != req.params.adminId;
		});
		await req.classroom.save();
		const answer = await User.findByIdAndUpdate(req.params.adminId, {
			$pullAll: {
				classes: [{ _id: req.params.id }],
			},
		});
		req.flash('success', 'Removed Admin');
		res.redirect(`/class/${req.params.id}/admin`);
	})
);

app.post(
	'/class/:id/admin/add-leader',
	isLogedIn,
	permissions,
	isAdmin,
	catchAsync(async (req, res) => {
		if (!Array.isArray(req.body.usernames)) {
			req.body.usernames = [req.body.usernames];
		}
		if (!Array.isArray(req.body.emails)) {
			req.body.emails = [req.body.emails];
		}
		let usernamesRegistered = [];
		for (i = 0; i < req.body.usernames.length; i++) {
			let userData = {
				email: req.body.emails[i],
				username: req.body.usernames[i],
				status: 'Leader',
				cpClass: req.body.cpClass,
				classes: [req.params.id],
				password: req.body.password,
			};
			validateUser(userData);
			let user = new User(userData);
			try {
				let newUser = await User.register(user, req.body.password);
				if (req.classroom.leaders.indexOf(newUser.id) === -1) {
					req.classroom.leaders.push(newUser.id);
				}
			} catch (err) {
				usernamesRegistered.push(user.username);
			}
		}
		await req.classroom.save();
		if (usernamesRegistered.length) {
			console.log('here');
			req.flash(
				'error',
				'Registration failed for: ',
				usernamesRegistered.join(', ')
			);
		} else {
			req.flash('success', 'Added new leaders');
		}
		res.redirect(`/class/${req.params.id}/admin`);
	})
);
app.delete(
	'/class/:id/admin/leader/:leaderId',
	isLogedIn,
	permissions,
	isAdmin,
	catchAsync(async (req, res) => {
		req.classroom.leaders = req.classroom.leaders.filter(function (ele) {
			return ele.id != req.params.leaderId;
		});
		await req.classroom.save();
		await User.findByIdAndUpdate(req.params.leaderId, {
			$pullAll: {
				classes: [{ _id: req.params.id }],
			},
		});
		req.flash('success', 'Removed leader');
		res.redirect(`/class/${req.params.id}/admin`);
	})
);

const jobInClass = function (req, res, next) {
	const jobListingIds = req.classroom.jobListings.map((j) => j.id);
	if (!jobListingIds.includes(req.params.jobId)) {
		res.status = 403;
		req.flash('error', 'This job is not in your class');
		res.redirect(`/class/${req.params.id}`);
		return;
	}
	next();
};
app.post(
	'/class/:id/:jobId/interested',
	isLogedIn,
	permissions,
	isInClass,
	jobInClass,
	catchAsync(async (req, res) => {
		const job = await JobListing.findById(req.params.jobId);
		if (job.interested.includes(req.user.id)) {
			res.json({ result: 'already interested' });
		} else {
			job.interested.push(req.user.id);
			let save = await job.save();
			res.json({ result: 'added to interested' });
		}
	})
);

function arrayRemove(arr, value) {
	return arr.filter(function (ele) {
		return ele != value;
	});
}
app.post(
	'/class/:id/:jobId/not-interested',
	isLogedIn,
	permissions,
	isInClass,
	jobInClass,
	catchAsync(async (req, res) => {
		const job = await JobListing.findById(req.params.jobId);
		if (!job.interested.includes(req.user.id)) {
			res.json({ result: 'already not interested' });
		} else {
			job.interested = arrayRemove(job.interested, req.user.id);
			let save = await job.save();
			res.json({ result: 'removed from interested' });
		}
	})
);
app.get(
	'/class/:id/:jobId',
	isLogedIn,
	permissions,
	isAdmin,
	jobInClass,
	catchAsync(async (req, res) => {
		const job = await JobListing.findById(req.params.jobId).lean();
		job.classId = req.classroom.id;
		job.id = String(job._id);
		res.render('edit', job);
	})
);

app.get(
	'/class/:id/:jobId/career-tracks',
	isLogedIn,
	permissions,
	isAdmin,
	jobInClass,
	catchAsync(async (req, res) => {
		const job = await JobListing.findById(req.params.jobId).lean();
		res.json([...job.careerTracks]);
	})
);

app.patch(
	'/class/:id/:jobId',
	isLogedIn,
	permissions,
	isAdmin,
	jobInClass,
	validateJob,
	catchAsync(async (req, res) => {
		const updatedJob = await JobListing.findByIdAndUpdate(req.params.jobId, {
			...req.body,
		});
		req.flash('success', 'Successfully updated job');
		res.redirect(`/class/${req.params.id}`);
	})
);

app.delete(
	'/class/:id/:jobId',
	isLogedIn,
	permissions,
	isAdmin,
	jobInClass,
	catchAsync(async (req, res) => {
		await JobListing.findByIdAndDelete(req.params.jobId);
		req.flash('success', 'Successfully deleted job');
		res.redirect(`/class/${req.params.id}`);
	})
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
		if (req.body.cpClass === '') delete req.body.cpClass;
		validateUser(req.body);
		const user = new User(req.body);
		user.classes = [];
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

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Something went wrong';
	res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});
