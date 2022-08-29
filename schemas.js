const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

main().catch((err) => console.log(err));

async function main() {
	await mongoose.connect('mongodb://localhost:27017/cp_job_listings');
}
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
	className: { type: String, required: true },
	leaders: [{ type: mongoose.ObjectId, ref: 'user' }],
	admin: [{ type: mongoose.ObjectId, ref: 'user' }],
	owner: { type: mongoose.ObjectId, ref: 'user', required: true },
	jobListings: [{ type: mongoose.ObjectId, ref: 'job_Listing' }],
	classCode: { type: String, unique: true, required: true },
});

const Classroom = mongoose.model('classroom', classroomSchema);

const jobListingSchema = new Schema({
	jobTitle: { type: String, required: true },
	company: { type: String, required: true },
	careerTracks: [{ type: String, required: true }],
	salary: { type: Number, required: true },
	salaryType: { type: String, required: true, enum: ['Hourly', 'Yearly'] },
	description: { type: String, required: true },
	tags: [
		{
			type: String,
			required: true,
			enum: [
				'Core',
				'Alumni',
				'Temp',
				'Part Time',
				'Remote',
				'Background Check',
				'Flexible Hours',
			],
		},
	],
	interested: [{ type: mongoose.ObjectId, ref: 'user' }],
});

const JobListing = mongoose.model('job_Listing', jobListingSchema);

const userScema = new Schema({
	email: { type: String, reequired: true, unique: true },
	classes: [{ type: mongoose.ObjectId, ref: 'classroom' }],
});
userScema.plugin(passportLocalMongoose);

const User = mongoose.model('user', userScema);

module.exports = { Classroom, JobListing, User };
