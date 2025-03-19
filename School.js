const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Federal Government College', 'Federal Government Girls College', 'Kings College', 'Queens College', 'Federal Science College', 'Other']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Mixed']
  },
  location: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    region: {
      type: String,
      required: true,
      enum: ['North East', 'North Central', 'North West', 'South West', 'South East', 'South South']
    },
    country: {
      type: String,
      default: 'Nigeria',
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  foundedYear: {
    type: Number
  },
  logo: {
    type: String
  },
  banner: {
    type: String
  },
  description: {
    type: String
  },
  website: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  adminUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  alumniCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
SchoolSchema.index({ name: 1 });
SchoolSchema.index({ shortName: 1 });
SchoolSchema.index({ 'location.region': 1 });
SchoolSchema.index({ 'location.state': 1 });
SchoolSchema.index({ type: 1 });
SchoolSchema.index({ gender: 1 });

module.exports = mongoose.model('School', SchoolSchema);
