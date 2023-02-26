const { User } = require('../schemas');
const passport = require('passport');
require('dotenv').config();
const { validateUser } = require('../utiles/joiValidation');
const catchAsync = require('../utiles/catchAsync');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const ExpressError = require('../utiles/expressError');

sgMail.setApiKey(process.env.SENDGRID);

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
		if (
			!req.body.cpClass.year ||
			!req.body.cpClass.class ||
			!req.body.cpClass.location
		) {
			delete req.body.cpClass;
		}
		if (!req.body.careerTrack) delete req.body.careerTrack
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

module.exports.forgetForm = (req, res) => {
	res.render('forget');
};

module.exports.forget = catchAsync(async (req, res) => {
	const user = await User.findOne({ email: req.body.email });
	if (user) {
		let resetCode = crypto.randomBytes(48).toString('hex');
		user.resetCode = { code: resetCode, created: Date() };
		await user.save();
		const link = `http://${req.headers.host}/reset-password/${user.id}/${resetCode}`;
		const msg = {
			to: user.email,
			from: 'apps@crosspurpose.org',
			subject: 'Forget Password for CrossPurpose Jobs',
			text: `Use this link to reset your password: ${link}\nDo not share this link with anyone. Link will expire in 15 minutes`,
			html: `<p>Use this link to reset your password: <a href='${link}'>${link}</a><br>Do not share this link with anyone. Link will expire in 15 minutes</p>`,
		};
		try {
			await sgMail.send(msg);
		} catch (error) {
			console.error(error);

			if (error.response) {
				console.error(error.response.body);
			}
		}
	}
	req.flash('success', 'Email sent with link to change password');
	res.redirect('/forget-password');
});
module.exports.validateLink = catchAsync(async (req, res, next) => {
	req.userReset = await User.findById(req.params.userId);

	if (!req.userReset || req.userReset.resetCode.code !== req.params.code) {
		req.flash('error', 'Invalid Link');
		res.redirect('/login');
		return;
	}

	const now = new Date();
	const minBetween =
		(now.getTime() - req.userReset.resetCode.created.getTime()) / (60 * 1000);
	if (minBetween > 15) {
		req.flash('error', 'Link has expired');
		res.redirect('/forget-password');
		return;
	}
	next();
});
module.exports.resetForm = (req, res) => {
	res.render('resetPassword');
};

module.exports.reset = catchAsync(async (req, res) => {
	await req.userReset.setPassword(req.body.password, async (err, user) => {
		if (err) {
			throw new ExpressError('Could not change password', 500);
		}
		req.userReset.resetCode = undefined;
		await req.userReset.save();
	});
	req.flash('success', 'Password has been changed');
	res.redirect('/login');
});

module.exports.changePasswordForm = (req, res) => {
	res.render('reset');
};

module.exports.changePassword = catchAsync(async (req, res) => {
	await res.locals.user.changePassword(
		req.body.oldPassword,
		req.body.newPassword,
		async (err) => {
			if (err) {
				throw new ExpressError('Could not change password', 500);
			}
			await res.locals.user.save();
		}
	);
	req.flash('success', 'Password has been changed');
	res.redirect('/profile');
});
