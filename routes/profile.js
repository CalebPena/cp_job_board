const express = require('express');
const router = express.Router({ mergeParams: true });
const profile = require('../controllers/profile');

const isLoggedIn = require('../utiles/loggedIn');

router.get('/', isLoggedIn, profile.renderProfile);

// router.post('/', isLoggedIn, profile.updateProfile);

router.patch('/username', isLoggedIn, profile.updateUsername);

module.exports = router;
