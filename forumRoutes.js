const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { auth, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', forumController.getAllForums);
router.get('/general', forumController.getGeneralForum);
router.get('/school/:schoolId', forumController.getForumsBySchool);
router.get('/:id', forumController.getForumById);

// Protected routes
router.post('/', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), forumController.createForum);
router.put('/:id', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), forumController.updateForum);
router.post('/moderator/add', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), forumController.addModerator);
router.post('/moderator/remove', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), forumController.removeModerator);

module.exports = router;
