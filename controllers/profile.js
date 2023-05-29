const catchAsync = require('../utiles/catchAsync');
const {
	validateCpClass,
	validateUsername,
} = require('../utiles/joiValidation');
const { JobListing } = require('../schemas');

module.exports.renderProfile = async (req, res) => {
	const classes = res.locals.user.classes;
	const interested = [];
	for (const classroom of classes) {
		const jobs = await JobListing.find({
			_id: { $in: classroom.jobListings },
		});
		for (const job of jobs) {
			for (const inter of job.interested) {
				if (inter.user == res.locals.user.id) {
					interested.push({
						status: inter.status,
						dreamJob: inter.dreamJob,
						jobTitle: job.jobTitle,
						company: job.company,
						archived: job.archive,
					});
				}
			}
		}
	}
	res.render('profile', { interested: interested });
};

module.exports.updateProfile = catchAsync(async (req, res) => {
	const { status, cpClass, careerTrack } = req.body;
	validateCpClass(cpClass);
	res.locals.user.status = status;
	res.locals.user.cpClass = cpClass;
	res.locals.user.careerTrack = careerTrack;
	await res.locals.user.save();

	res.redirect('/profile');
});

module.exports.updateUsername = catchAsync(async (req, res) => {
	const { username } = req.body;
	try {
		validateUsername(username);
		res.locals.user.username = username;
		await res.locals.user.save();
	} catch (error) {
		req.flash('error', 'Invalid username. Please use a different username.');
	}

	res.redirect('/profile');
});
