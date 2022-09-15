const catchAsync = require('../utiles/catchAsync');
const { Classroom, JobListing, User } = require('../schemas');
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
	let jobs = classroom.jobListings.reverse();
	for (i = 0; i < jobs.length; i++) {
		let job = jobs[i];
		job.id = String(job._id);
		if (job.interested.some((u) => u.user._id == req.user.id)) {
			job.userIsInterested = true;
		} else {
			job.userIsInterested = false;
		}
		job.createdDaysAgo = parseInt(
			moment.duration(moment() - job.dateAdded).asDays()
		);
		job.interested = job.interested.map((leader) => {
			return {
				...leader,
				timeSince: parseInt(moment.duration(moment() - leader.date).asDays()),
			};
		});
	}
	res.render('jobListings', { id: req.params.id, jobs: jobs });
});

module.exports.leave = catchAsync(async (req, res) => {
	const removeUser = function (user) {
		return req.user.id != user.id;
	};
	if (req.user.permissions === 'owner') {
		req.flash(
			'error',
			'You can not leave this class because you are the owner'
		);
	} else if (req.user.permissions === 'admin') {
		const initialAdmin = req.classroom.admin.length;
		req.classroom.admin = req.classroom.admin.filter(removeUser);
		if (initialAdmin === req.classroom.admin.length) {
			req.flash('error', 'You are not in this class');
		} else {
			await req.classroom.save();
			await User.findByIdAndUpdate(req.params.leaderId, {
				$pullAll: { classes: [{ _id: req.params.id }] },
			});
			req.flash('success', 'You have left the class');
		}
	} else if (req.user.permissions === 'leader') {
		const initialLeaders = req.classroom.leaders.length;
		req.classroom.leaders = req.classroom.leaders.filter(removeUser);
		if (initialLeaders === req.classroom.leaders.length) {
			req.flash('error', 'You are not in this class');
		} else {
			await req.classroom.save();
			await User.findByIdAndUpdate(req.user.id, {
				$pullAll: { classes: [{ _id: req.params.id }] },
			});
			req.flash('success', 'You have left the class');
		}
	}
	res.redirect('/profile');
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

module.exports.changeStatus = catchAsync(async (req, res) => {
	console.log(req.params.selectId);
	const job = await JobListing.find({
		'interested.id': req.params.selectId,
	});
	console.log(job.map((e) => e.interested.map((el) => el.id)));
	res.status(200);
});
