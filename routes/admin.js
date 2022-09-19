const express = require('express');
const router = express.Router({ mergeParams: true });
const isOwner = require('../utiles/auth/owner');
const isAdmin = require('../utiles/auth/admin');
const {
	validateTagDropdown,
	validateCareerDropdown,
} = require('../utiles/joiValidation');

const admin = require('../controllers/admin');

router.use(isAdmin);

router.get('/', admin.adminPage);

router.post('/add-admin', isOwner, admin.addAdmin);

router.delete('/admin/:adminId', isOwner, admin.deleteAdmin);

router.post('/add-leader', admin.addLeader);

router.delete('/leader/:leaderId', admin.deleteLeader);

router.post('/tag', validateTagDropdown, admin.addTag);

router.delete('/tag/:tag', admin.removeTag);

router.post('/career-track', validateCareerDropdown, admin.addCareer);

router.delete('/career-track/:careerTrack', admin.removeCareer);

module.exports = router;
