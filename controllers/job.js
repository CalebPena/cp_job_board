const { JobListing } = require('../schemas');
const catchAsync = require('../utiles/catchAsync');

function arrayRemove(arr, value) {
	return arr.filter(function (ele) {
		return ele != value;
	});
}

module.exports.interested = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	if (job.interested.includes(req.user.id)) {
		res.json({ result: 'already interested' });
	} else {
		job.interested.push(req.user.id);
		let save = await job.save();
		res.json({ result: 'added to interested' });
	}
});

module.exports.notInterested = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId);
	if (!job.interested.includes(req.user.id)) {
		res.json({ result: 'already not interested' });
	} else {
		job.interested = arrayRemove(job.interested, req.user.id);
		let save = await job.save();
		res.json({ result: 'removed from interested' });
	}
});

module.exports.editForm = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId).lean();
	job.classId = req.classroom.id;
	job.id = String(job._id);
	res.render('edit', job);
});

module.exports.careerTracks = catchAsync(async (req, res) => {
	const job = await JobListing.findById(req.params.jobId).lean();
	res.json([...job.careerTracks]);
});

module.exports.edit = catchAsync(async (req, res) => {
	const updatedJob = await JobListing.findByIdAndUpdate(req.params.jobId, {
		...req.body,
	});
	req.flash('success', 'Successfully updated job');
	res.redirect(`/class/${req.params.id}`);
});

module.exports.delete = catchAsync(async (req, res) => {
	await JobListing.findByIdAndDelete(req.params.jobId);
	req.flash('success', 'Successfully deleted job');
	res.redirect(`/class/${req.params.id}`);
});
