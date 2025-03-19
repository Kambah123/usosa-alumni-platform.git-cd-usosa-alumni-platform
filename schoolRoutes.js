const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { auth, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', schoolController.getAllSchools);
router.get('/region/:region', schoolController.getSchoolsByRegion);
router.get('/:id', schoolController.getSchoolById);

// Protected routes - Admin only
router.post('/', auth, checkRole(['usosa_admin', 'super_admin']), schoolController.createSchool);
router.put('/:id', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), schoolController.updateSchool);
router.delete('/:id', auth, checkRole(['usosa_admin', 'super_admin']), schoolController.deleteSchool);
router.post('/admin/add', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), schoolController.addSchoolAdmin);
router.post('/admin/remove', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), schoolController.removeSchoolAdmin);
router.post('/:id/logo', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), schoolController.uploadSchoolLogo);
router.post('/:id/banner', auth, checkRole(['school_admin', 'usosa_admin', 'super_admin']), schoolController.uploadSchoolBanner);

module.exports = router;
