const express = require('express');
const router = express.Router({ mergeParams: true });

const auth = require('../controllers/auth');

router.get('/login', auth.loginForm);

router.post('/login', auth.login, auth.loginRedirect);

router.get('/register', auth.registerForm);

router.post('/register', auth.register);

router.get('/logout', auth.logout);

module.exports = router;
