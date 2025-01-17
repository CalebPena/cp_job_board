module.exports = function (req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		req.flash('error', 'You must be logged in');
		res.redirect('/login');
	}
};
