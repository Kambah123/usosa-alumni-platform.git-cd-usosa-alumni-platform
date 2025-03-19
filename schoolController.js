const School = require('../models/School');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/schools');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'school-' + uniqueSuffix + ext);
  }
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Get all schools
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find({ isActive: true })
      .sort({ name: 1 });
    
    res.status(200).json({ schools });
  } catch (error) {
    console.error('Get all schools error:', error);
    res.status(500).json({ message: 'Server error while fetching schools' });
  }
};

// Get schools by region
exports.getSchoolsByRegion = async (req, res) => {
  try {
    const { region } = req.params;
    
    const schools = await School.find({ 'location.region': region, isActive: true })
      .sort({ name: 1 });
    
    res.status(200).json({ schools });
  } catch (error) {
    console.error('Get schools by region error:', error);
    res.status(500).json({ message: 'Server error while fetching schools by region' });
  }
};

// Get school by ID
exports.getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const school = await School.findOne({ _id: id, isActive: true })
      .populate('adminUsers', 'firstName lastName email profilePicture');
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    res.status(200).json({ school });
  } catch (error) {
    console.error('Get school by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching school' });
  }
};

// Create school
exports.createSchool = async (req, res) => {
  try {
    // Check if user has admin role
    if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create schools' });
    }
    
    const {
      name,
      shortName,
      type,
      gender,
      location,
      foundedYear,
      website,
      email,
      phoneNumber,
      address,
      description,
      adminUsers
    } = req.body;
    
    // Check if school with same name already exists
    const existingSchool = await School.findOne({ name });
    if (existingSchool) {
      return res.status(400).json({ message: 'School with this name already exists' });
    }
    
    // Create new school
    const school = new School({
      name,
      shortName,
      type,
      gender,
      location,
      foundedYear,
      website,
      email,
      phoneNumber,
      address,
      description,
      adminUsers: adminUsers || [req.user.id]
    });
    
    await school.save();
    
    res.status(201).json({
      message: 'School created successfully',
      school
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ message: 'Server error during school creation' });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only update their school
      if (!school.adminUsers.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to update this school' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update schools' });
    }
    
    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name !== school.name) {
      const existingSchool = await School.findOne({ name: updateData.name });
      if (existingSchool) {
        return res.status(400).json({ message: 'School with this name already exists' });
      }
    }
    
    // Update school fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        school[key] = updateData[key];
      }
    });
    
    school.updatedAt = Date.now();
    await school.save();
    
    res.status(200).json({
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ message: 'Server error during school update' });
  }
};

// Delete/Deactivate school
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has admin role
    if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete schools' });
    }
    
    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Soft delete by setting isActive to false
    school.isActive = false;
    await school.save();
    
    res.status(200).json({
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ message: 'Server error during school deletion' });
  }
};

// Add admin to school
exports.addSchoolAdmin = async (req, res) => {
  try {
    const { schoolId, userId } = req.body;
    
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only add admins to their school
      if (!school.adminUsers.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to add admins to this school' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to add school admins' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already an admin
    if (school.adminUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is already an admin for this school' });
    }
    
    // Add user to admins
    school.adminUsers.push(userId);
    await school.save();
    
    // Update user role if needed
    if (user.role === 'alumni' || user.role === 'user') {
      user.role = 'school_admin';
      await user.save();
    }
    
    res.status(200).json({
      message: 'School admin added successfully',
      school
    });
  } catch (error) {
    console.error('Add school admin error:', error);
    res.status(500).json({ message: 'Server error while adding school admin' });
  }
};

// Remove admin from school
exports.removeSchoolAdmin = async (req, res) => {
  try {
    const { schoolId, userId } = req.body;
    
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only remove admins from their school
      if (!school.adminUsers.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to remove admins from this school' });
      }
      
      // School admin cannot remove themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot remove yourself as admin' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to remove school admins' });
    }
    
    // Check if user is an admin
    if (!school.adminUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is not an admin for this school' });
    }
    
    // Remove user from admins
    school.adminUsers = school.adminUsers.filter(id => id.toString() !== userId);
    
    // Ensure at least one admin remains
    if (school.adminUsers.length === 0) {
      return res.status(400).json({ message: 'Cannot remove the last admin from a school' });
    }
    
    await school.save();
    
    res.status(200).json({
      message: 'School admin removed successfully',
      school
    });
  } catch (error) {
    console.error('Remove school admin error:', error);
    res.status(500).json({ message: 'Server error while removing school admin' });
  }
};

// Upload school logo
exports.uploadSchoolLogo = async (req, res) => {
  try {
    const uploadMiddleware = upload.single('logo');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
      }
      
      const { id } = req.params;
      
      const school = await School.findById(id);
      if (!school) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'School not found' });
      }
      
      // Check authorization
      if (req.user.role === 'school_admin') {
        // School admin can only update their school
        if (!school.adminUsers.includes(req.user.id)) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ message: 'Not authorized to update this school' });
        }
      } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Not authorized to update schools' });
      }
      
      // Delete old logo if exists
      if (school.logo) {
        const oldLogoPath = path.join(__dirname, '../../', school.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      // Update school with new logo path
      const relativePath = path.join('uploads/schools', req.file.filename);
      school.logo = relativePath;
      school.updatedAt = Date.now();
      await school.save();
      
      res.status(200).json({
        message: 'School logo uploaded successfully',
        logo: relativePath
      });
    });
  } catch (error) {
    console.error('Upload school logo error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};

// Upload school banner
exports.uploadSchoolBanner = async (req, res) => {
  try {
    const uploadMiddleware = upload.single('banner');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
      }
      
      const { id } = req.params;
      
      const school = await School.findById(id);
      if (!school) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'School not found' });
      }
      
      // Check authorization
      if (req.user.role === 'school_admin') {
        // School admin can only update their school
        if (!school.adminUsers.includes(req.user.id)) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ message: 'Not authorized to update this school' });
        }
      } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Not authorized to update schools' });
      }
      
      // Delete old banner if exists
      if (school.banner) {
        const oldBannerPath = path.join(__dirname, '../../', school.banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
      
      // Update school with new banner path
      const relativePath = path.join('uploads/schools', req.file.filename);
      school.banner = relativePath;
      school.updatedAt = Date.now();
      await school.save();
      
      res.status(200).json({
        message: 'School banner uploaded successfully',
        banner: relativePath
      });
    });
  } catch (error) {
    console.error('Upload school banner error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};
