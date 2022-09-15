const config = require('platformsh-config').config();

const mongoConnection = config.isValidPlatform()
	? config.formattedCredentials('mongodatabase', 'mongodb')
	: 'mongodb://localhost:27017/cp_job_listings';
console.log(mongoConnection);
