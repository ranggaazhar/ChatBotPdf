const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/logs', authMiddleware, adminMiddleware, logController.getSearchLogs);

module.exports = router;
