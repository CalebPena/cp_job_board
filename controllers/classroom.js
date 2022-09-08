const catchAsync = require('../utiles/catchAsync');
const { Classroom, JobListing } = require('../schemas');
const moment = require('moment');

module.exports.jobListings = catchAsync(async (req, res) => {
	const classroom = await Classroom.findById(req.params.id)
		.populate({
			path: 'jobListings',
			populate: {
				path: 'interested',
				populate: {
					path: 'user',
				},
			},
		})
		.lean();
	let jobs = classroom.jobListings;
	for (i = 0; i < jobs.length; i++) {
		let job = jobs[i];
		if (job.interested.some((u) => u.user == req.user.id)) {
			job.userIsInterested = true;
		} else {
			job.userIsInterested = false;
		}
		job.interested = job.interested.map((lead) => {
			return {
				...lead,
				timeSince: parseInt(moment.duration(moment() - lead.date).asDays()),
			};
		});
		job.id = String(job._id);
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
