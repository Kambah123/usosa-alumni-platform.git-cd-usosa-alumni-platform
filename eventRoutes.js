const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected routes
router.post('/', auth, checkRole(['alumni', 'school_admin', 'usosa_admin', 'super_admin']), eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.post('/:id/register', auth, eventController.registerForEvent);
router.post('/:id/cancel-registration', auth, eventController.cancelRegistration);
router.post('/:id/attendee/:userId', auth, eventController.updateAttendeeStatus);
router.post('/:id/invite', auth, eventController.inviteToEvent);
router.post('/:id/banner', auth, eventController.uploadEventBanner);

module.exports = router;
