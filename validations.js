const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
	type: 'string',
	base: joi.string(),
	messages: {
		'string.escapeHTML':
			'{{#label}} must not include HTML! (&, <, > are not allowed)',
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
	careerTracks: Joi.array()
		.items(Joi.string().max(64).trim().escapeHTML())
		.single(),
	salary: Joi.object({
		min: Joi.number().required().min(0),
		max: Joi.number().min(0),
	}),
	salaryType: Joi.string().required().valid('Hourly', 'Yearly').escapeHTML(),
	description: Joi.string().required().trim().escapeHTML(),
	tags: Joi.array().items(Joi.string().valid().escapeHTML()).single(),
});

module.exports.jobValidation = job;

const classroom = Joi.object({
	className: Joi.string().required().max(64).trim().escapeHTML(),
});

module.exports.classroomValidation = classroom;

const cpClass = Joi.object({
	year: Joi.number().integer().min(2010).max(2100),
	class: Joi.string().trim().escapeHTML().valid('C1', 'C2', 'C3', 'C4'),
	location: Joi.string().trim().escapeHTML().max(3),
}).and('year', 'class', 'location');

module.exports.cpClassValidation = cpClass;

const user = Joi.object({
	username: Joi.string().required().trim().escapeHTML(),
	email: Joi.string().required().trim().email().escapeHTML(),
	status: Joi.string()
		.required()
		.trim()
		.valid('Leader', 'Alumni', 'Coach')
		.escapeHTML(),
	cpClass: cpClass,
	password: Joi.string().trim().min(8).required().escapeHTML(),
	classes: Joi.array(),
});

module.exports.userValidation = user;

const tagDropdown = Joi.object({
	tag: Joi.string().required().trim().escapeHTML(),
});

module.exports.tagDropdownValidation = tagDropdown;

const careerTrackDropdown = Joi.object({
	career: Joi.string().required().trim().escapeHTML(),
});

module.exports.careerTrackDropdownValidation = careerTrackDropdown;
