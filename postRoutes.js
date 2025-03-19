const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/topic/:topicId', postController.getPostsByTopic);

// Protected routes
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.toggleLikePost);
router.post('/:id/report', auth, postController.reportPost);
router.post('/:id/report/:reportId/handle', auth, postController.handlePostReport);

module.exports = router;
