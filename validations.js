const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
	type: 'string',
	base: joi.string(),
	messages: {
		'string.escapeHTML': '{{#label}} must not include HTML!',
	},
	rules: {
		escapeHTML: {
			validate(value, helpers) {
				const clean = sanitizeHtml(value, {
					allowedTags: [],
					allowedAttributes: {},
				});
				if (clean !== value)
					return helpers.error('string.escapeHTML', { value });
				return clean;
			},
		},
	},
});

const Joi = BaseJoi.extend(extension);

const job = Joi.object({
	jobTitle: Joi.string().required().max(64).trim().escapeHTML(),
	company: Joi.string().required().max(64).trim().escapeHTML(),
	careerTracks: Joi.array().items(Joi.string().max(64).trim().escapeHTML()),
	salary: Joi.number().required().positive(),
	salaryType: Joi.string().required().valid('Hourly', 'Yearly').escapeHTML(),
	description: Joi.string().required().trim().escapeHTML(),
	tags: Joi.array().items(
		Joi.string()
			.valid(
				'Core',
				'Alumni',
				'Temp',
				'Part Time',
				'Remote',
				'Background Check',
				'Flexible Hours'
			)
			.escapeHTML()
	),
});

module.exports.jobValidation = job;

const classroom = Joi.object({
	className: Joi.string().required().max(64).trim().escapeHTML(),
});

module.exports.classroomValidation = classroom;

const user = Joi.object({
	username: Joi.string().required().trim().escapeHTML(),
	email: Joi.string().required().trim().email().escapeHTML(),
	status: Joi.string()
		.required()
		.trim()
		.valid('Leader', 'Alumni', 'Coach')
		.escapeHTML(),
	cpClass: Joi.string().trim().escapeHTML(),
	password: Joi.string().trim().min(8).required().escapeHTML(),
	classes: Joi.array(),
});

module.exports.userValidation = user;
