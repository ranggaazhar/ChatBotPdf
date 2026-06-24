const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Rute manajemen sesi percakapan (Threads) dan pengiriman pesan
router.post('/', authMiddleware, chatController.handleChat);
router.get('/threads', authMiddleware, chatController.getThreads);
router.get('/threads/:threadId', authMiddleware, chatController.getThreadMessages);
router.delete('/threads/:threadId', authMiddleware, chatController.deleteThread);

module.exports = router;
