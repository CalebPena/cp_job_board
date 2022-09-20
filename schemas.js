const { valid } = require('joi');
const mongoose = require('mongoose');
const config = require('platformsh-config').config();
const passportLocalMongoose = require('passport-local-mongoose');

main().catch((err) => console.log(err));

async function main() {
	const mongoConnection = config.isValidPlatform()
		? config.formattedCredentials('mongodatabase', 'mongodb')
		: 'mongodb://localhost:27017/cp_job_listings';
	await mongoose.connect(mongoConnection, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	});
}
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
	className: { type: String, required: true },
	leaders: [{ type: mongoose.ObjectId, ref: 'user' }],
	admin: [{ type: mongoose.ObjectId, ref: 'user' }],
	owner: { type: mongoose.ObjectId, ref: 'user', required: true },
	jobListings: [{ type: mongoose.ObjectId, ref: 'job_Listing' }],
	classCode: { type: String, unique: true, required: true },
	validTags: [String],
	validCareerTracks: [String],
	pendingLeaders: [{ type: mongoose.ObjectId, ref: 'user' }],
});

const Classroom = mongoose.model('classroom', classroomSchema);

const interestedScema = new Schema({
	user: { type: mongoose.ObjectId, ref: 'user', required: true },
	date: { type: Date, required: true },
	status: {
		type: String,
		default: 'new',
		enum: ['new', 'followUp', 'nextSteps', 'badFit'],
	},
});

const jobListingSchema = new Schema({
	jobTitle: { type: String, required: true },
	company: { type: String, required: true },
	careerTracks: [{ type: String }],
	salary: { type: Number, required: true },
	salaryType: { type: String, required: true, enum: ['Hourly', 'Yearly'] },
	description: { type: String, required: true },
	tags: [
		{
			type: String,
			required: true,
		},
	],
	dateAdded: { type: Date, required: true },
	interested: [interestedScema],
	archive: { type: Boolean, default: false },
});

const JobListing = mongoose.model('job_Listing', jobListingSchema);

const userScema = new Schema({
	email: { type: String, required: true, unique: true },
	classes: [{ type: mongoose.ObjectId, ref: 'classroom' }],
	status: { type: String, required: true, enum: ['Leader', 'Alumni', 'Coach'] },
	cpClass: String,
	adminReq: [{ type: mongoose.ObjectId, ref: 'classroom' }],
});
userScema.plugin(passportLocalMongoose);

const User = mongoose.model('user', userScema);

module.exports = { Classroom, JobListing, User };
