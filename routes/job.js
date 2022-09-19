const express = require('express');
const router = express.Router({ mergeParams: true });
const isAdmin = require('../utiles/auth/admin');
const isInClass = require('../utiles/auth/inClass');
const jobInClass = require('../utiles/auth/jobInClass');
const { validateJob } = require('../utiles/joiValidation');

const job = require('../controllers/job');

router.use(jobInClass);

router.post('/interested', isInClass, job.interested);

router.post('/not-interested', isInClass, job.notInterested);

router.get('/', isAdmin, job.editForm);

router.patch('/', isAdmin, validateJob, job.edit);

router.delete('/', isAdmin, job.archive);

router.patch('/archive', isAdmin, job.unarchive);

module.exports = router;
