const validInput = require('./validInput');
const {
	jobValidation,
	classroomValidation,
	userValidation,
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
