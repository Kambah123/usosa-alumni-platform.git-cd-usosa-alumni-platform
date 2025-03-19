const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForumSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    // null for general USOSA forum
  },
  isGeneral: {
    type: Boolean,
    default: false
  },
  moderators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  topics: {
    type: Number,
    default: 0
  },
  posts: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes for faster queries
ForumSchema.index({ schoolId: 1 });
ForumSchema.index({ isGeneral: 1 });
ForumSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Forum', ForumSchema);
