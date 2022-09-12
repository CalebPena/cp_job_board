const { Classroom } = require('../schemas');
const { User } = require('../schemas');
const catchAsync = require('../utiles/catchAsync');

module.exports.renderHome = (req, res) => {
	res.render('home');
};

module.exports.renderCreate = (req, res) => {
	res.render('create');
};

module.exports.create = catchAsync(async (req, res) => {
	let classCode = Math.random().toString(36).substring(2, 8);
	const classroom = new Classroom({
		className: req.body.className,
		jobListings: [],
		owner: req.user._id,
	});
	while (true) {
		let classWithCode = await Classroom.find({ classCode: classCode });
		if (classWithCode) break;
		classCode = Math.random().toString(36).substring(2, 8);
	}
	classroom.classCode = classCode;
	await classroom.save();
	await User.findByIdAndUpdate(req.user.id, {
		$push: { classes: classroom.id },
	});
	req.flash('success', 'Created new classroom');
	res.redirect(`/class/${classroom.id}/admin`);
});

module.exports.join = catchAsync(async (req, res) => {
	const classroom = await Classroom.findOne({
		classCode: req.body.classCode,
	});
	if (classroom) {
		if (
			classroom.leaders.indexOf(req.user.id) === -1 &&
			classroom.admin.indexOf(req.user.id) === -1 &&
			classroom.owner != req.user.id
		) {
			classroom.leaders.push(req.user.id);
		} else {
			req.flash('error', 'You are already in this class');
			res.redirect('/');
			return;
		}
		await classroom.save();
		const user = await User.findById(req.user.id);
		user.classes.push(classroom.id);
		await user.save();
		req.flash('success', 'Joined classroom');
		res.redirect(`/class/${classroom.id}`);
	} else {
		req.flash('error', 'Wrong code');
		res.redirect('/');
	}
});
