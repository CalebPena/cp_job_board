const catchAsync = require('../catchAsync');
const { Classroom } = require('../../schemas');

module.exports = catchAsync(async function (req, res, next) {
	const classId = req.params.id;
	const userId = req.user.id;
	const hasId = (element) => {
		return element.id === userId;
	};
	req.classroom = await Classroom.findById(classId)
		.populate('leaders')
		.populate('coaches')
		.populate('admin')
		.populate('owner')
		.populate('jobListings')
		.populate('pendingLeaders');
	res.locals.classroom = req.classroom;
	if (req.classroom.owner.id === userId) {
		req.user.permissions = 'owner';
	} else if (Array.from(req.classroom.admin).some(hasId)) {
		req.user.permissions = 'admin';
	} else if (Array.from(req.classroom.coaches).some(hasId)) {
		req.user.permissions = 'coach';
	} else if (Array.from(req.classroom.leaders).some(hasId)) {
		req.user.permissions = 'leader';
	} else {
		req.user.permissions = false;
	}
	res.locals.user.permissions = req.user.permissions;
	next();
});
