const { JobListing } = require('../schemas');
const catchAsync = require('../utiles/catchAsync');

module.exports.interested = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	if (job.interested.some((u) => u.user == req.user.id)) {
		res.json({ result: 'already interested' });
	} else {
		job.interested.push({ user: req.user.id, date: Date() });
		let save = await job.save();
		res.json({ result: 'added to interested' });
	}
});

module.exports.notInterested = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	if (!job.interested.some((u) => u.user == req.user.id)) {
		res.json({ result: 'already not interested' });
	} else {
		job.interested = job.interested.filter(
			(inter) => inter.user != req.user.id
		);
		let save = await job.save();
		res.json({ result: 'removed from interested' });
	}
});

module.exports.editForm = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	job.classId = req.classroom.id;
	res.render('edit', job);
});

const ensureArray = function (obj) {
	for (let i = 0; i < arguments.length; i++) {
		if (obj[arguments[i]] === undefined) obj[arguments[i]] = [];
	}
	return obj;
};

module.exports.edit = catchAsync(async (req, res) => {
	req.body = ensureArray(req.body, 'tags', 'careerTracks');
	const updatedJob = await JobListing.findByIdAndUpdate(
		req.params.jobId,
		{
			...req.body,
		},
		{ useFindAndModify: false }
	);
	req.flash('success', 'Successfully updated job');
	res.redirect(`/class/${req.params.id}`);
});

module.exports.archive = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	job.archive = true;
	await job.save();
	req.flash('success', 'Successfully archived job');
	res.redirect(`/class/${req.params.id}`);
});

module.exports.unarchive = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	job.archive = false;
	await job.save();
	req.flash('success', 'Successfully brought back job');
	res.redirect(`/class/${req.params.id}`);
});
