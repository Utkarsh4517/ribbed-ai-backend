const express = require('express');
const authRoutes = require('./authRoutes');
const avatarRoutes = require('./avatarRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', avatarRoutes);
router.use('/', healthRoutes);

module.exports = router;