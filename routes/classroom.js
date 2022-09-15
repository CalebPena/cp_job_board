const express = require('express');
const router = express.Router({ mergeParams: true });
const isLoggedIn = require('../utiles/loggedIn');
const { validateJob } = require('../utiles/joiValidation');
const admin = require('./admin');
const job = require('./job');

const permissions = require('../utiles/auth/permitions');
const isAdmin = require('../utiles/auth/admin');
const isInClass = require('../utiles/auth/inClass');

const classroom = require('../controllers/classroom');

router.use(isLoggedIn);

router.use(permissions);

router.get('/', isInClass, classroom.jobListings);

router.delete('/', isInClass, classroom.leave);

router.get('/jobs', isInClass, classroom.jobs);

router.get('/create', isAdmin, classroom.createForm);

router.post('/create', isAdmin, validateJob, classroom.addJob);

router.use('/admin', admin);

router.patch(
	'/interested/:selectId/status',
	isInClass,
	isAdmin,
	classroom.changeStatus
);

router.use('/:jobId', job);

module.exports = router;
