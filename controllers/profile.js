const catchAsync = require('../utiles/catchAsync');

module.exports.renderProfile = (req, res) => {
	res.render('profile');
};

module.exports.updateProfile = catchAsync(async (req, res) => {
	const { status, cpClass } = req.body;
	res.locals.user.status = status;
	res.locals.user.cpClass = cpClass;
	res.locals.user.save();

	res.redirect('/profile');
});
