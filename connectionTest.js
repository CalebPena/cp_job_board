const config = require('platformsh-config').config();
const mongoose = require('mongoose');

const mongoConnection = config.isValidPlatform()
	? config.formattedCredentials('mongodatabase', 'mongodb')
	: 'mongodb://localhost:27017/cp_job_listings';
console.log(mongoConnection);

mongoose.connect(mongoConnection, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
