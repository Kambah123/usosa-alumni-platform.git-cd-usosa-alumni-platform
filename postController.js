const Post = require('../models/Post');
const Topic = require('../models/Topic');
const Forum = require('../models/Forum');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get posts by topic
exports.getPostsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if topic exists
    const topic = await Topic.findOne({ _id: topicId, isDeleted: false });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Get posts with pagination
    const posts = await Post.find({ topicId, isDeleted: false })
      .populate('userId', 'firstName lastName middleName email profilePicture')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Count total posts for pagination
    const totalPosts = await Post.countDocuments({ topicId, isDeleted: false });
    
    res.status(200).json({
      posts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: parseInt(page),
      totalPosts
    });
  } catch (error) {
    console.error('Get posts by topic error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
};

// Create post
exports.createPost = async (req, res) => {
  try {
    const { topicId, content, parentPostId } = req.body;
    
    // Check if topic exists and is not locked
    const topic = await Topic.findOne({ _id: topicId, isDeleted: false });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    if (topic.isLocked) {
      return res.status(403).json({ message: 'This topic is locked and cannot receive new posts' });
    }
    
    // If this is a reply, check if parent post exists
    if (parentPostId) {
      const parentPost = await Post.findOne({ _id: parentPostId, isDeleted: false });
      if (!parentPost) {
        return res.status(404).json({ message: 'Parent post not found' });
      }
    }
    
    // Create new post
    const post = new Post({
      topicId,
      userId: req.user.id,
      content,
      parentPostId: parentPostId || null
    });
    
    await post.save();
    
    // Update topic stats
    topic.replies += 1;
    topic.lastPostId = post._id;
    topic.lastPostAt = Date.now();
    topic.lastPostUserId = req.user.id;
    await topic.save();
    
    // Update forum stats
    const forum = await Forum.findById(topic.forumId);
    forum.posts += 1;
    forum.lastActivity = Date.now();
    await forum.save();
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error during post creation' });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the post creator or has moderator/admin privileges
    const topic = await Topic.findById(post.topicId);
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (post.userId.toString() !== req.user.id && !isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    // Update post content
    post.content = content;
    post.isEdited = true;
    post.editedAt = Date.now();
    post.updatedAt = Date.now();
    await post.save();
    
    res.status(200).json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error during post update' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the post creator or has moderator/admin privileges
    const topic = await Topic.findById(post.topicId);
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (post.userId.toString() !== req.user.id && !isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    // Soft delete post
    post.isDeleted = true;
    await post.save();
    
    // Update topic stats
    topic.replies -= 1;
    
    // If this was the last post, update the last post info
    if (topic.lastPostId.toString() === id) {
      const lastPost = await Post.findOne({ topicId: topic._id, isDeleted: false })
        .sort({ createdAt: -1 });
      
      if (lastPost) {
        topic.lastPostId = lastPost._id;
        topic.lastPostAt = lastPost.createdAt;
        topic.lastPostUserId = lastPost.userId;
      } else {
        // If no posts left, use the topic creation info
        topic.lastPostId = null;
        topic.lastPostAt = topic.createdAt;
        topic.lastPostUserId = topic.userId;
      }
    }
    
    await topic.save();
    
    // Update forum stats
    forum.posts -= 1;
    await forum.save();
    
    res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error during post deletion' });
  }
};

// Like/Unlike post
exports.toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user already liked the post
    const userLikedIndex = post.likes.indexOf(req.user.id);
    
    if (userLikedIndex === -1) {
      // Add like
      post.likes.push(req.user.id);
    } else {
      // Remove like
      post.likes.splice(userLikedIndex, 1);
    }
    
    await post.save();
    
    res.status(200).json({
      message: userLikedIndex === -1 ? 'Post liked successfully' : 'Post unliked successfully',
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Toggle like post error:', error);
    res.status(500).json({ message: 'Server error while toggling post like' });
  }
};

// Report post
exports.reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required for reporting a post' });
    }
    
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user already reported the post
    const existingReport = post.reports.find(report => report.userId.toString() === req.user.id);
    
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }
    
    // Add report
    post.reports.push({
      userId: req.user.id,
      reason,
      createdAt: Date.now(),
      status: 'pending'
    });
    
    await post.save();
    
    res.status(200).json({
      message: 'Post reported successfully'
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ message: 'Server error while reporting post' });
  }
};

// Handle post report (for moderators and admins)
exports.handlePostReport = async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const { action } = req.body;
    
    if (!['dismiss', 'delete_post'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "dismiss" or "delete_post"' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user has moderator/admin privileges
    const topic = await Topic.findById(post.topicId);
    const forum = await Forum.findById(topic.forumId);
    const isModeratorOrAdmin = forum.moderators.includes(req.user.id) || 
                              ['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isModeratorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to handle post reports' });
    }
    
    // Find the report
    const reportIndex = post.reports.findIndex(report => report._id.toString() === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update report status
    post.reports[reportIndex].status = 'reviewed';
    
    if (action === 'delete_post') {
      // Soft delete post
      post.isDeleted = true;
      
      // Update topic stats
      topic.replies -= 1;
      
      // If this was the last post, update the last post info
      if (topic.lastPostId.toString() === id) {
        const lastPost = await Post.findOne({ topicId: topic._id, isDeleted: false })
          .sort({ createdAt: -1 });
        
        if (lastPost) {
          topic.lastPostId = lastPost._id;
          topic.lastPostAt = lastPost.createdAt;
          topic.lastPostUserId = lastPost.userId;
        } else {
          // If no posts left, use the topic creation info
          topic.lastPostId = null;
          topic.lastPostAt = topic.createdAt;
          topic.lastPostUserId = topic.userId;
        }
      }
      
      await topic.save();
      
      // Update forum stats
      forum.posts -= 1;
      await forum.save();
    }
    
    await post.save();
    
    res.status(200).json({
      message: action === 'dismiss' ? 'Report dismissed' : 'Post deleted based on report',
      post
    });
  } catch (error) {
    console.error('Handle post report error:', error);
    res.status(500).json({ message: 'Server error while handling post report' });
  }
};
