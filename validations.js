const Joi = require('joi');

const job = Joi.object({
	jobTitle: Joi.string().required().max(64).trim(),
	company: Joi.string().required().max(64).trim(),
	careerTracks: Joi.array().items(Joi.string().max(64).trim()),
	salary: Joi.number().required().positive(),
	salaryType: Joi.string().required().valid('Hourly', 'Yearly'),
	description: Joi.string().required().trim(),
	tags: Joi.array().items(
		Joi.string().valid(
			'Core',
			'Alumni',
			'Temp',
			'Part Time',
			'Remote',
			'Background Check',
			'Flexible Hours'
		)
	),
});

module.exports.jobValidation = job;

const classroom = Joi.object({
	className: Joi.string().required().max(64).trim(),
});

module.exports.classroomValidation = classroom;
