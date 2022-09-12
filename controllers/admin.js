const catchAsync = require('../utiles/catchAsync');
const { Classroom, User } = require('../schemas');
const { validateUser } = require('../utiles/joiValidation');
const moment = require('moment');

module.exports.adminPage = (req, res) => {
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
						title: job.jobTitle,
						date: parseInt(
							moment.duration(
								moment() -
									job.interested
										.filter((l) => l.user == leader.id)[0]
										.date.getTime()
							).asDays
						),
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
	try {
		await Classroom.findByIdAndUpdate(req.params.id, {
			$addToSet: { admin: newAdmin.id },
		});
		newAdmin.classes.push(req.classroom.id);
		await newAdmin.save();
	} catch (err) {
		req.flash('error', `Failed to add Admin`);
		res.redirect(`/class/${req.params.id}/admin`);
		return;
	}
	req.flash('success', `Added new admin: ${username}`);
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
		validateUser(userData);
		let user = new User(userData);
		try {
			let newUser = await User.register(user, req.body.password);
			if (req.classroom.leaders.indexOf(newUser.id) === -1) {
				req.classroom.leaders.push(newUser.id);
			}
		} catch (err) {
			usernamesRegistered.push(user.username);
		}
	}
	await req.classroom.save();
	if (usernamesRegistered.length) {
		console.log('here');
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
	await req.classroom.save();
	await User.findByIdAndUpdate(req.params.leaderId, {
		$pullAll: {
			classes: [{ _id: req.params.id }],
		},
	});
	req.flash('success', 'Removed leader');
	res.redirect(`/class/${req.params.id}/admin`);
});
