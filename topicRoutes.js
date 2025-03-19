const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/forum/:forumId', topicController.getTopicsByForum);
router.get('/:id', topicController.getTopicById);

// Protected routes
router.post('/', auth, topicController.createTopic);
router.put('/:id', auth, topicController.updateTopic);
router.delete('/:id', auth, topicController.deleteTopic);
router.post('/:id/pin', auth, topicController.togglePinTopic);
router.post('/:id/lock', auth, topicController.toggleLockTopic);

module.exports = router;
