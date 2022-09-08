module.exports = function (req, res, next) {
	const jobListingIds = req.classroom.jobListings.map((j) => j.id);
	if (!jobListingIds.includes(req.params.jobId)) {
		res.status = 403;
		req.flash('error', 'This job is not in your class');
		res.redirect(`/class/${req.params.id}`);
		return;
	}
	next();
};
