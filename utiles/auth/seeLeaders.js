module.exports = function (req, res, next) {
	if (['coach', 'admin', 'owner'].includes(req.user.permissions)) {
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
