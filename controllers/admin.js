const catchAsync = require('../utiles/catchAsync');
const { User, Classroom, JobListing } = require('../schemas');
const { validateUser } = require('../utiles/joiValidation');
const moment = require('moment');
const ExpressError = require('../utiles/expressError');

module.exports.adminPage = async (req, res) => {
	const isLeaderInterested = (leader) => {
		return (job) =>
			job.interested.some((inter) => {
				return inter.user == leader.id;
			});
	};
	const interested = req.classroom.leaders.reduce((acc, leader) => {
		return (acc = {
			...acc,
			[leader.id]: req.classroom.jobListings
				.filter(isLeaderInterested(leader))
				.map((job) => {
					return {
						JobId: job.id,
						title: job.jobTitle,
						date: parseInt(
							moment
								.duration(
									moment() -
										job.interested
											.filter((l) => l.user == leader.id)[0]
											.date.getTime()
								)
								.asDays()
						),
						interestedId: job.interested.filter((l) => l.user == leader.id)[0]
							.id,
						status: job.interested.filter((l) => l.user == leader.id)[0].status,
						dreamJob: job.interested.filter((l) => l.user == leader.id)[0]
							.dreamJob,
					};
				}),
		});
	}, {});
	res.render('admin', {
		id: req.params.id,
		admin: req.classroom.admin,
		leaders: req.classroom.leaders,
		interested: interested,
	});
};

module.exports.addAdmin = catchAsync(async (req, res) => {
	const username = req.body.username;
	const newAdmin = await User.findOne({ username: username });
	if (!newAdmin || newAdmin.id === req.user.id) {
		req.flash(
			'error',
			'You can not add yourself as an admin, or admin does not exist'
		);
		res.redirect(`/class/${req.params.id}/admin`);
		return;
	}
	newAdmin.adminReq.push(req.params.id);
	await newAdmin.save();

	req.flash('success', `Requested ${username} to become a new admin`);
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.deleteAdmin = catchAsync(async (req, res) => {
	const startAdminNum = req.classroom.admin.length;
	req.classroom.admin = req.classroom.admin.filter((ele) => {
		if (req.params.adminId == req.user.id) return true;
		return ele.id != req.params.adminId;
	});
	if (req.classroom.admin.length === startAdminNum) {
		req.flash('error', 'Admin not in class');
		res.redirect(`/class/${req.params.id}/admin`);
		return;
	}
	await req.classroom.save();
	const answer = await User.findByIdAndUpdate(req.params.adminId, {
		$pullAll: {
			classes: [{ _id: req.params.id }],
		},
	});
	req.flash('success', 'Removed Admin');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.addLeader = catchAsync(async (req, res) => {
	if (!Array.isArray(req.body.usernames)) {
		req.body.usernames = [req.body.usernames];
	}
	if (!Array.isArray(req.body.emails)) {
		req.body.emails = [req.body.emails];
	}
	let usernamesRegistered = [];
	for (i = 0; i < req.body.usernames.length; i++) {
		let userData = {
			email: req.body.emails[i],
			username: req.body.usernames[i],
			status: 'Leader',
			cpClass: req.body.cpClass,
			classes: [req.params.id],
			password: req.body.password,
		};
		let user = new User(userData);
		try {
			validateUser(userData);
			let newUser = await User.register(user, req.body.password);
			if (req.classroom.leaders.indexOf(newUser.id) === -1) {
				req.classroom.leaders.push(newUser.id);
			} else {
				throw new ExpressError('User already in class', 400);
			}
		} catch (err) {
			usernamesRegistered.push(user.username);
		}
	}
	await req.classroom.save();
	if (usernamesRegistered.length) {
		req.flash(
			'error',
			'Registration failed for: ',
			usernamesRegistered.join(', ')
		);
	} else {
		req.flash('success', 'Added new leaders');
	}
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.deleteLeader = catchAsync(async (req, res) => {
	req.classroom.leaders = req.classroom.leaders.filter(function (ele) {
		return ele.id != req.params.leaderId;
	});

	for (let job of req.classroom.jobListings) {
		job.interested = job.interested.filter(function (inter) {
			return inter.user != req.params.leaderId;
		});
		await job.save();
	}

	await req.classroom.save();
	await User.findByIdAndUpdate(
		req.params.leaderId,
		{
			$pullAll: {
				classes: [{ _id: req.params.id }],
			},
		},
		{ useFindAndModify: false }
	);
	req.flash('success', 'Removed leader');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.accept = catchAsync(async (req, res) => {
	if (
		!req.classroom.pendingLeaders.some(
			(leader) => leader.id === req.params.leaderId
		)
	) {
		req.flash('error', 'Leader is not asking to join this class');
		res.redirect(`/class/${req.classroom.id}/admin`);
		return;
	}

	req.classroom.leaders.push(req.params.leaderId);
	req.classroom.pendingLeaders = req.classroom.pendingLeaders.filter(
		(leader) => leader.id !== req.params.leaderId
	);
	await req.classroom.save();
	const user = await User.findByIdAndUpdate(
		req.params.leaderId,
		{
			$push: { classes: req.classroom.id },
		},
		{
			useFindAndModify: false,
		}
	);
	req.flash('success', 'Leader has joined the class');
	res.redirect(`/class/${req.classroom.id}/admin`);
});

module.exports.deny = catchAsync(async (req, res) => {
	req.classroom.pendingLeaders = req.classroom.pendingLeaders.filter(
		(leader) => leader.id !== req.params.leaderId
	);
	await req.classroom.save();
	req.flash('success', 'Leader denyed from class');
	res.redirect(`/class/${req.classroom.id}/admin`);
});

module.exports.addTag = catchAsync(async (req, res) => {
	req.classroom.validTags.push(req.body.tag);
	await req.classroom.save();
	req.flash('success', 'Added tag');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.removeTag = catchAsync(async (req, res) => {
	req.classroom.validTags = req.classroom.validTags.filter(
		(tag) => tag !== req.params.tag
	);
	req.classroom.save();
	req.flash('success', 'Removed tag');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.addCareer = catchAsync(async (req, res) => {
	req.classroom.validCareerTracks.push(req.body.career);
	await req.classroom.save();
	req.flash('success', 'Added career track');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.removeCareer = catchAsync(async (req, res) => {
	req.classroom.validCareerTracks = req.classroom.validCareerTracks.filter(
		(ct) => ct !== req.params.careerTrack
	);
	req.classroom.save();
	req.flash('success', 'Removed career track');
	res.redirect(`/class/${req.params.id}/admin`);
});

module.exports.deleteClassroom = catchAsync(async (req, res) => {
	const classroom = await Classroom.findById(req.params.id);
	await JobListing.deleteMany({ _id: { $in: classroom.jobListings } });
	await Classroom.deleteOne({ _id: req.params.id });
	res.redirect('/');
});
