const { User } = require('../schemas');
const passport = require('passport');
require('dotenv').config();
const { validateUser } = require('../utiles/joiValidation');
const catchAsync = require('../utiles/catchAsync');

module.exports.loginForm = (req, res) => {
	res.render('login');
};

module.exports.login = passport.authenticate('local', {
	failureFlash: true,
	failureRedirect: '/login',
});

module.exports.loginRedirect = (req, res) => {
	req.flash('success', `Welcome, ${req.user.username}`);
	res.redirect('/');
};

module.exports.registerForm = (req, res) => {
	res.render('register');
};

module.exports.register = catchAsync(async (req, res) => {
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

module.exports.logout = (req, res, next) => {
	req.logOut((e) => {
		if (e) {
			return next(e);
		}
		req.flash('success', 'Logout complete');
		res.redirect('/login');
	});
};
