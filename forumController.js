const Forum = require('../models/Forum');
const Topic = require('../models/Topic');
const Post = require('../models/Post');
const School = require('../models/School');
const User = require('../models/User');

// Get all forums
exports.getAllForums = async (req, res) => {
  try {
    const forums = await Forum.find({ isActive: true })
      .populate('schoolId', 'name shortName type location')
      .sort({ isGeneral: -1, name: 1 });
    
    res.status(200).json({ forums });
  } catch (error) {
    console.error('Get all forums error:', error);
    res.status(500).json({ message: 'Server error while fetching forums' });
  }
};

// Get general USOSA forum
exports.getGeneralForum = async (req, res) => {
  try {
    const forum = await Forum.findOne({ isGeneral: true, isActive: true });
    
    if (!forum) {
      return res.status(404).json({ message: 'General forum not found' });
    }
    
    res.status(200).json({ forum });
  } catch (error) {
    console.error('Get general forum error:', error);
    res.status(500).json({ message: 'Server error while fetching general forum' });
  }
};

// Get forums by school
exports.getForumsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    const forums = await Forum.find({ schoolId, isActive: true })
      .populate('schoolId', 'name shortName type location')
      .sort({ name: 1 });
    
    res.status(200).json({ forums });
  } catch (error) {
    console.error('Get forums by school error:', error);
    res.status(500).json({ message: 'Server error while fetching forums' });
  }
};

// Get forum by ID
exports.getForumById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const forum = await Forum.findOne({ _id: id, isActive: true })
      .populate('schoolId', 'name shortName type location')
      .populate('moderators', 'firstName lastName email profilePicture');
    
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    res.status(200).json({ forum });
  } catch (error) {
    console.error('Get forum by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching forum' });
  }
};

// Create forum
exports.createForum = async (req, res) => {
  try {
    const { name, description, schoolId, isGeneral, moderators } = req.body;
    
    // Check if user has admin role
    if (!['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create forums' });
    }
    
    // If school-specific forum, check if school exists
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      
      // If school admin, check if they are admin for this school
      if (req.user.role === 'school_admin') {
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to create forums for this school' });
        }
      }
    } else if (isGeneral) {
      // Only USOSA admin or super admin can create general forums
      if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to create general forums' });
      }
    }
    
    // Create new forum
    const forum = new Forum({
      name,
      description,
      schoolId: schoolId || null,
      isGeneral: isGeneral || false,
      moderators: moderators || [req.user.id]
    });
    
    await forum.save();
    
    res.status(201).json({
      message: 'Forum created successfully',
      forum
    });
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({ message: 'Server error during forum creation' });
  }
};

// Update forum
exports.updateForum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, moderators, isActive } = req.body;
    
    const forum = await Forum.findById(id);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only update forums for their school
      if (forum.schoolId) {
        const school = await School.findById(forum.schoolId);
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to update this forum' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to update general forums' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update forums' });
    }
    
    // Update forum fields
    if (name) forum.name = name;
    if (description) forum.description = description;
    if (moderators) forum.moderators = moderators;
    if (isActive !== undefined) forum.isActive = isActive;
    
    forum.updatedAt = Date.now();
    await forum.save();
    
    res.status(200).json({
      message: 'Forum updated successfully',
      forum
    });
  } catch (error) {
    console.error('Update forum error:', error);
    res.status(500).json({ message: 'Server error during forum update' });
  }
};

// Add moderator to forum
exports.addModerator = async (req, res) => {
  try {
    const { forumId, userId } = req.body;
    
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only add moderators to forums for their school
      if (forum.schoolId) {
        const school = await School.findById(forum.schoolId);
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to add moderators to this forum' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to add moderators to general forums' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to add forum moderators' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a moderator
    if (forum.moderators.includes(userId)) {
      return res.status(400).json({ message: 'User is already a moderator for this forum' });
    }
    
    // Add user to moderators
    forum.moderators.push(userId);
    await forum.save();
    
    res.status(200).json({
      message: 'Moderator added successfully',
      forum
    });
  } catch (error) {
    console.error('Add moderator error:', error);
    res.status(500).json({ message: 'Server error while adding moderator' });
  }
};

// Remove moderator from forum
exports.removeModerator = async (req, res) => {
  try {
    const { forumId, userId } = req.body;
    
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    // Check authorization
    if (req.user.role === 'school_admin') {
      // School admin can only remove moderators from forums for their school
      if (forum.schoolId) {
        const school = await School.findById(forum.schoolId);
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to remove moderators from this forum' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to remove moderators from general forums' });
      }
    } else if (!['usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to remove forum moderators' });
    }
    
    // Check if user is a moderator
    if (!forum.moderators.includes(userId)) {
      return res.status(400).json({ message: 'User is not a moderator for this forum' });
    }
    
    // Remove user from moderators
    forum.moderators = forum.moderators.filter(id => id.toString() !== userId);
    
    // Ensure at least one moderator remains
    if (forum.moderators.length === 0) {
      return res.status(400).json({ message: 'Cannot remove the last moderator from a forum' });
    }
    
    await forum.save();
    
    res.status(200).json({
      message: 'Moderator removed successfully',
      forum
    });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({ message: 'Server error while removing moderator' });
  }
};
