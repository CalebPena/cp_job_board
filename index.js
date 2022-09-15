const express = require('express');
const config = require('platformsh-config').config();
const ejs = require('ejs');
const engine = require('ejs-mate');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const methodOverride = require('method-override');
const { User } = require('./schemas');
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
const isLogedIn = require('./utiles/loggedIn');
const { validateClassroom } = require('./utiles/joiValidation');
const main = require('./controllers/main');

const app = express();

const classRoutes = require('./routes/classroom');
const authentecation = require('./routes/auth');
const profile = require('./routes/profile');

app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'static')));

const mongoConnection = config.isValidPlatform()
	? config.formattedCredentials('mongodatabase', 'mongodb')
	: 'mongodb://localhost:27017/cp_job_listings';
console.log(mongoConnection);
const sessionConfig = {
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
		uri: mongoConnection,
		collection: 'mySessions',
		expires: 7 * 24 * 60 * 60,
	}),
};
const useSession = session(sessionConfig);
app.use(useSession);
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

app.get('/', isLogedIn, main.renderHome);

app.get('/class/create', isLogedIn, main.renderCreate);

app.post('/class/create', isLogedIn, validateClassroom, main.create);

app.post('/join', isLogedIn, main.join);

app.use('/profile', profile);

app.use('/class/:id', classRoutes);

app.use('/', authentecation);

app.all('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = 'Something went wrong';
	res.status(statusCode).render('error', { err });
});

const port = config.isValidPlatform() ? config.port : 3000;

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
