const mongoose = require('mongoose');
const config = require('platformsh-config').config();
const passportLocalMongoose = require('passport-local-mongoose');

main().catch((err) => console.error(err));

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
	coaches: [{ type: mongoose.ObjectId, ref: 'user' }],
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
		default: 'New',
	},
	dreamJob: {type: Boolean, default: false}
});

const jobListingSchema = new Schema({
	jobTitle: { type: String, required: true },
	company: { type: String, required: true },
	location: { type: String, default: 'Denver' },
	careerTracks: [{ type: String }],
	salary: new Schema({
		min: { type: Number, required: true },
		max: { type: Number },
	}),
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
	username: {type: String, required: true, unique: true},
	email: { type: String, required: true, unique: true },
	classes: [{ type: mongoose.ObjectId, ref: 'classroom' }],
	status: { type: String, required: true, enum: ['Leader', 'Alumni', 'Coach'] },
	cpClass: new Schema({
		year: { type: Number, default: 2010 },
		class: { type: String, enum: ['C1', 'C2', 'C3', 'C4'], default: 'C1' },
		location: { type: String, default: 'DEN' },
	}),
	careerTrack: {type: String},
	adminReq: [{ type: mongoose.ObjectId, ref: 'classroom' }],
	coachReq: [{ type: mongoose.ObjectId, ref: 'classroom' }],
	resetCode: new Schema({ code: String, created: Date }),
});
userScema.plugin(passportLocalMongoose, {usernameField: 'email'});

const User = mongoose.model('user', userScema);

module.exports = { Classroom, JobListing, User };
