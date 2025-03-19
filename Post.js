const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  topicId: {
    type: Schema.Types.ObjectId,
    ref: 'Topic',
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
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  parentPostId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  reports: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
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
PostSchema.index({ topicId: 1, createdAt: 1 });
PostSchema.index({ userId: 1 });
PostSchema.index({ parentPostId: 1 });

module.exports = mongoose.model('Post', PostSchema);
