const catchAsync = require('../utiles/catchAsync');
const { Classroom, JobListing } = require('../schemas');

module.exports.jobListings = catchAsync(async (req, res) => {
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
});

module.exports.jobs = catchAsync(async (req, res) => {
	let classroom = await Classroom.findById(req.params.id)
		.populate('jobListings')
		.lean();
	classroom.jobListings.forEach((job) => {
		delete job.interested;
	});
	res.json(classroom.jobListings);
});

module.exports.createForm = (req, res) => {
	res.render('createJob', { id: req.params.id });
};

module.exports.addJob = catchAsync(async (req, res) => {
	const job = new JobListing(req.body);
	job.interested = [];
	job.dateAdded = Date();
	await job.save();
	await Classroom.findByIdAndUpdate(req.params.id, {
		$push: { jobListings: job.id },
	});
	req.flash('success', 'Successfully added new job listing');
	res.redirect(`/class/${req.params.id}`);
});
