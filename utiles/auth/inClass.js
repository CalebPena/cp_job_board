module.exports = function (req, res, next) {
	if (req.user.permissions) {
		next();
		return;
	} else {
		req.flash('error', 'You are not in this class');
		res.redirect(`/`);
	}
};
