const validInput = require('./validInput');
const {
	jobValidation,
	classroomValidation,
	userValidation,
	careerTrackDropdownValidation,
	tagDropdownValidation,
} = require('../validations');

module.exports.validateClassroom = function (req, res, next) {
	const { error } = classroomValidation.validate(req.body);
	validInput(error, next);
};

module.exports.validateUser = function (obj) {
	const { error } = userValidation.validate(obj);
	validInput(error);
};

module.exports.validateJob = function (req, res, next) {
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
