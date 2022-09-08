module.exports = function (error, next) {
	if (error) {
		const msg = error.details.map((el) => el.message).join(',');
		throw new ExpressError(msg, 400);
	} else {
		if (next) next();
	}
};
