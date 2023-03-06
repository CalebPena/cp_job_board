const catchAsync = require('../utiles/catchAsync');
const { Classroom, JobListing } = require('../schemas');
const moment = require('moment');
const ObjectId = require('mongoose').Types.ObjectId;

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
	if (req.user.permissions === 'leader') {
		jobs = jobs.filter((job) => job.archive !== true);
	}
	for (i = 0; i < jobs.length; i++) {
		let job = jobs[i];
		job.id = String(job._id);

		job.userIsInterested = false;
		for (let inter of job.interested) {
			if (inter.user._id == req.user.id) {
				job.userIsInterested = true;
				job.dreamJob = inter.dreamJob
				break
			}
		}
		job.createdDaysAgo = parseInt(
			moment.duration(moment() - job.dateAdded).asDays()
		);
		if (typeof job.salary === 'number') {
			job.salary = job.salary.toFixed(2);
		} else if (job.salary.max) {
			job.salary = `${job.salary.min.toFixed(2)}-${job.salary.max.toFixed(2)}`;
		} else {
			job.salary = job.salary.min.toFixed(2);
		}
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
			res.locals.user.classes = res.locals.user.classes.filter(
				(cl) => cl.id !== req.params.id
			);
			await res.locals.user.save();
			req.flash('success', 'You have left the class');
		}
	} else if (req.user.permissions === 'leader') {
		const initialLeaders = req.classroom.leaders.length;
		req.classroom.leaders = req.classroom.leaders.filter(removeUser);
		if (initialLeaders === req.classroom.leaders.length) {
			req.flash('error', 'You are not in this class');
		} else {
			await req.classroom.save();
			res.locals.user.classes = res.locals.user.classes.filter(
				(cl) => cl.id !== req.params.id
			);
			await res.locals.user.save();
			req.flash('success', 'You have left the class');
		}
	}
	res.redirect('/profile');
});

module.exports.adminJoin = catchAsync(async (req, res) => {
	try {
		if (!req.user.adminReq.includes(req.params.id)) {
			throw 'not invited to join';
		}
		res.locals.user.adminReq = res.locals.user.adminReq.filter(
			(cl) => cl.id !== req.params.id
		);
		await Classroom.findByIdAndUpdate(
			req.params.id,
			{
				$addToSet: { admin: req.user.id },
			},
			{ useFindAndModify: false }
		);
		res.locals.user.classes.push(req.classroom.id);
		await res.locals.user.save();
	} catch (err) {
		req.flash('error', `Failed to join`);
		res.redirect(`/profile`);
		return;
	}
	req.flash('success', 'Joined class as admin');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.adminDeny = catchAsync(async (req, res) => {
	if (!req.user.adminReq.includes(req.params.id)) {
		req.flash('error', 'You were not invited to join this class');
		res.redirect('/profile');
		return;
	}
	res.locals.user.adminReq = res.locals.user.adminReq.filter(
		(cl) => cl.id !== req.params.id
	);
	await res.locals.user.save();
	req.flash('success', 'Rejected admin request');
	res.redirect(`/profile`);
});

module.exports.jobs = catchAsync(async (req, res) => {
	let classroom = req.classroom;
	if (req.user.permissions === 'leader') {
		classroom.jobListings = classroom.jobListings.filter(
			(job) => job.archive !== true
		);
	}
	if (req.user.permissions === 'leader') {
		classroom.jobListings.forEach((job) => {
			delete job.interested;
		});
	}
	res.status(200).json(classroom.jobListings);
});

module.exports.createForm = (req, res) => {
	res.render('createJob', { id: req.params.id });
};

module.exports.addJob = catchAsync(async (req, res) => {
	const job = new JobListing(req.body);
	job.interested = [];
	job.dateAdded = Date();
	await job.save();
	await Classroom.findByIdAndUpdate(
		req.params.id,
		{
			$push: { jobListings: job.id },
		},
		{ useFindAndModify: false }
	);
	req.flash('success', 'Successfully added new job listing');
	res.redirect(`/class/${req.params.id}`);
});

module.exports.changeStatus = catchAsync(async (req, res) => {
	try {
		const job = await JobListing.findOne({
			'interested._id': ObjectId(req.params.selectId),
		});
		job.interested.forEach((inter) => {
			if (inter.id === req.params.selectId) {
				inter.status = req.body.status;
			}
		});
		await job.save();
		res.status(200).json(job);
	} catch (err) {
		console.error(err);
		res.status(400).json({});
	}
});
