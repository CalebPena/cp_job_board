const express = require('express');
const router = express.Router({ mergeParams: true });
const isOwner = require('../utiles/auth/owner');
const isAdmin = require('../utiles/auth/admin');
const seeLeaders = require('../utiles/auth/seeLeaders');
const {
	validateTagDropdown,
	validateCareerDropdown,
} = require('../utiles/joiValidation');

const admin = require('../controllers/admin');

router.use(seeLeaders);

router.get('/', admin.adminPage);

router.use(isAdmin);

router.post('/add-admin', isOwner, admin.addAdmin);

router.delete('/admin/:adminId', isOwner, admin.deleteAdmin);

router.post('/add-coach', isOwner, admin.addCoach);

router.delete('/coach/:coachId', isOwner, admin.deleteCoach);

router.post('/add-leader', admin.addLeader);

router.delete('/leader/:leaderId', admin.deleteLeader);

router.post('/leader/:leaderId/accept', admin.accept);

router.post('/leader/:leaderId/deny', admin.deny);

router.post('/tag', validateTagDropdown, admin.addTag);

router.delete('/tag/:tag', admin.removeTag);

router.post('/career-track', validateCareerDropdown, admin.addCareer);

router.delete('/career-track/:careerTrack', admin.removeCareer);

router.delete('/', isOwner, admin.deleteClassroom);

module.exports = router;
