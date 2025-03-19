const Topic = require('../models/Topic');
const Post = require('../models/Post');
const Forum = require('../models/Forum');
const User = require('../models/User');

// Get topics by forum
exports.getTopicsByForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { page = 1, limit = 20, sort = 'latest' } = req.query;
    
    // Check if forum exists
    const forum = await Forum.findOne({ _id: forumId, isActive: true });
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort === 'latest') {
      sortOptions = { isPinned: -1, lastPostAt: -1 };
    } else if (sort === 'newest') {
      sortOptions = { isPinned: -1, createdAt: -1 };
    } else if (sort === 'popular') {
      sortOptions = { isPinned: -1, views: -1 };
    } else if (sort === 'most_replies') {
      sortOptions = { isPinned: -1, replies: -1 };
    }
    
    // Get topics with pagination
    const topics = await Topic.find({ forumId, isDeleted: false })
      .populate('userId', 'firstName lastName profilePicture')
      .populate('lastPostUserId', 'firstName lastName')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Count total topics for pagination
    const totalTopics = await Topic.countDocuments({ forumId, isDeleted: false });
    
    res.status(200).json({
      topics,
      totalPages: Math.ceil(totalTopics / limit),
      currentPage: parseInt(page),
      totalTopics
    });
  } catch (error) {
    console.error('Get topics by forum error:', error);
    res.status(500).json({ message: 'Server error while fetching topics' });
  }
};

// Get topic by ID
exports.getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await Topic.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'firstName lastName middleName email profilePicture')
      .populate('forumId', 'name schoolId isGeneral');
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Increment view count
    topic.views += 1;
    await topic.save();
    
    res.status(200).json({ topic });
  } catch (error) {
    console.error('Get topic by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching topic' });
  }
};

// Create topic
exports.createTopic = async (req, res) => {
  try {
    const { forumId, title, content, tags } = req.body;
    
    // Check if forum exists
    const forum = await Forum.findOne({ _id: forumId, isActive: true });
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    
    // Create new topic
    const topic = new Topic({
      title,
      forumId,
      userId: req.user.id,
      content,
      tags: tags || [],
      lastPostUserId: req.user.id
    });
    
    await topic.save();
    
    // Update forum stats
    forum.topics += 1;
    forum.posts += 1;
    forum.lastActivity = Date.now();
    await forum.save();
    
    res.status(201).json({
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ message: 'Server error during topic creation' });
  }
};

// Update topic
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user is the topic creator or has moderator/admin privileges
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (topic.userId.toString() !== req.user.id && !isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this topic' });
    }
    
    // Update topic fields
    if (title) topic.title = title;
    if (content) topic.content = content;
    if (tags) topic.tags = tags;
    
    topic.updatedAt = Date.now();
    await topic.save();
    
    res.status(200).json({
      message: 'Topic updated successfully',
      topic
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ message: 'Server error during topic update' });
  }
};

// Delete topic
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user is the topic creator or has moderator/admin privileges
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (topic.userId.toString() !== req.user.id && !isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this topic' });
    }
    
    // Soft delete topic
    topic.isDeleted = true;
    await topic.save();
    
    // Update forum stats
    forum.topics -= 1;
    forum.posts -= (topic.replies + 1); // Topic post + replies
    await forum.save();
    
    // Soft delete all posts in the topic
    await Post.updateMany({ topicId: id }, { isDeleted: true });
    
    res.status(200).json({
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error during topic deletion' });
  }
};

// Pin/Unpin topic
exports.togglePinTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user has moderator/admin privileges
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to pin/unpin topics' });
    }
    
    // Toggle pin status
    topic.isPinned = !topic.isPinned;
    await topic.save();
    
    res.status(200).json({
      message: topic.isPinned ? 'Topic pinned successfully' : 'Topic unpinned successfully',
      topic
    });
  } catch (error) {
    console.error('Toggle pin topic error:', error);
    res.status(500).json({ message: 'Server error while toggling topic pin status' });
  }
};

// Lock/Unlock topic
exports.toggleLockTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Check if user has moderator/admin privileges
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to lock/unlock topics' });
    }
    
    // Toggle lock status
    topic.isLocked = !topic.isLocked;
    await topic.save();
    
    res.status(200).json({
      message: topic.isLocked ? 'Topic locked successfully' : 'Topic unlocked successfully',
      topic
    });
  } catch (error) {
    console.error('Toggle lock topic error:', error);
    res.status(500).json({ message: 'Server error while toggling topic lock status' });
  }
};
