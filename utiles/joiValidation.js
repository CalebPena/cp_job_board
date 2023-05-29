const validInput = require('./validInput');
const {
	jobValidation,
	classroomValidation,
	userValidation,
	careerTrackDropdownValidation,
	tagDropdownValidation,
	cpClassValidation,
	username,
} = require('../validations');

module.exports.validateClassroom = function (req, res, next) {
	const { error } = classroomValidation.validate(req.body);
	validInput(error, next);
};

module.exports.validateUser = function (obj) {
	const { error } = userValidation.validate(obj);
	validInput(error);
};

module.exports.validateUsername = function (obj) {
	const { error } = username.validate(obj);
	validInput(error);
};

module.exports.validateJob = function (req, res, next) {
	if (req.body.salary.max === '') delete req.body.salary.max;
	const { error } = jobValidation.validate(req.body);
	validInput(error, next);
};

module.exports.validateTagDropdown = function (req, res, next) {
	const { error } = tagDropdownValidation.validate(req.body);
	validInput(error, next);
};

module.exports.validateCareerDropdown = function (req, res, next) {
	const { error } = careerTrackDropdownValidation.validate(req.body);
	validInput(error, next);
};

module.exports.validateCpClass = function (obj) {
	const { error } = cpClassValidation.validate(obj);
	validInput(error);
};
