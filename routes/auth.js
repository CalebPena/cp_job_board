const express = require('express');
const router = express.Router({ mergeParams: true });
const isLoggedIn = require('../utiles/loggedIn');

const auth = require('../controllers/auth');

router.get('/login', auth.loginForm);

router.post('/login', auth.login, auth.loginRedirect);

router.get('/register', auth.registerForm);

router.post('/register', auth.register);

router.get('/logout', auth.logout);

router.get('/forget-password', auth.forgetForm);

router.post('/forget-password', auth.forget);

router.get('/reset-password/:userId/:code', auth.validateLink, auth.resetForm);

router.post('/reset-password/:userId/:code', auth.validateLink, auth.reset);

router.get('/change-password', isLoggedIn, auth.changePasswordForm);

router.post('/change-password', isLoggedIn, auth.changePassword);

module.exports = router;
