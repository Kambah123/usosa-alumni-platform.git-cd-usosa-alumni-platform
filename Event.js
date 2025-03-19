const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Reunion', 'Seminar', 'Workshop', 'Conference', 'Networking', 'Social', 'Other']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    venue: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Nigeria'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isVirtual: {
      type: Boolean,
      default: false
    },
    virtualLink: String
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    // null for USOSA-wide events
  },
  isSchoolSpecific: {
    type: Boolean,
    default: false
  },
  banner: {
    type: String
  },
  capacity: {
    type: Number
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  },
  registrationFee: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  attendees: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'cancelled'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'completed', 'failed'],
      default: 'not_applicable'
    },
    paymentReference: String
  }],
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'alumni_only', 'school_alumni_only', 'invite_only'],
    default: 'alumni_only'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
EventSchema.index({ startDate: 1 });
EventSchema.index({ schoolId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ visibility: 1 });
EventSchema.index({ 'location.city': 1 });
EventSchema.index({ 'location.state': 1 });
EventSchema.index({ eventType: 1 });

module.exports = mongoose.model('Event', EventSchema);
