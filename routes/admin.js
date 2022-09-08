const express = require('express');
const router = express.Router({ mergeParams: true });
const isOwner = require('../utiles/auth/owner');
const isAdmin = require('../utiles/auth/admin');

const admin = require('../controllers/admin');

router.use(isAdmin);

router.get('/', admin.adminPage);

router.post('/add-admin', isOwner, admin.addAdmin);

router.delete('/admin/:adminId', isOwner, admin.deleteAdmin);

router.post('/add-leader', admin.addLeader);

router.delete('/leader/:leaderId', admin.deleteLeader);

module.exports = router;
