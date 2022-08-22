const mongoose = require('mongoose');

main().catch((err) => console.log(err));

async function main() {
	await mongoose.connect('mongodb://localhost:27017/cp_job_listings');
}
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
	className: { type: String, required: true },
	leaders: [{ type: mongoose.ObjectId, ref: 'users' }],
	admin: [{ type: mongoose.ObjectId, ref: 'users' }],
	// owner: { type: mongoose.ObjectId, ref: 'users', required: true },
	jobListings: [{ type: mongoose.ObjectId, ref: 'jobListings' }],
});

const Classroom = mongoose.model('classroom', classroomSchema);

const jobListingSchema = new Schema({
	jobTitle: { type: String, required: true },
	company: { type: String, required: true },
	careerTracks: [{ type: String, required: true }],
	salary: { type: Number, required: true },
	salaryType: { type: String, required: true, enum: ['hourly', 'yearly'] },
	description: { type: String, required: true },
	tags: [
		{
			type: String,
			required: true,
			enum: ['Core', 'Alumni', 'Temp', 'Part Time', 'Remote'],
		},
	],
});

const JobListing = mongoose.model('jobListing', jobListingSchema);

module.exports = { Classroom, JobListing };
