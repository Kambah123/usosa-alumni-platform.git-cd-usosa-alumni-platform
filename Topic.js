const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  forumId: {
    type: Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  replies: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastPostId: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  lastPostAt: {
    type: Date,
    default: Date.now
  },
  lastPostUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Indexes for faster queries
TopicSchema.index({ forumId: 1, createdAt: -1 });
TopicSchema.index({ forumId: 1, isPinned: -1, lastPostAt: -1 });
TopicSchema.index({ userId: 1 });
TopicSchema.index({ tags: 1 });

module.exports = mongoose.model('Topic', TopicSchema);
