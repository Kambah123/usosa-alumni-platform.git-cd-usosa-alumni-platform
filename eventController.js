const Event = require('../models/Event');
const User = require('../models/User');
const School = require('../models/School');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/events');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
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

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, school, status, upcoming = 'true' } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by event type
    if (type) {
      query.eventType = type;
    }
    
    // Filter by school
    if (school) {
      query.schoolId = school;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // Default to published events
      query.status = 'published';
    }
    
    // Filter for upcoming events
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }
    
    // Handle visibility based on user role
    if (!req.user || req.user.role === 'guest') {
      // Public users can only see public events
      query.visibility = 'public';
    } else if (req.user.role === 'alumni' || req.user.role === 'user') {
      // Alumni can see public and alumni_only events
      query.visibility = { $in: ['public', 'alumni_only'] };
      
      // If user has a school, also show school_alumni_only events for their school
      if (req.user.schoolId) {
        query.$or = [
          { visibility: { $in: ['public', 'alumni_only'] } },
          { visibility: 'school_alumni_only', schoolId: req.user.schoolId }
        ];
      }
    }
    // Admins can see all events
    
    // Get events with pagination
    const events = await Event.find(query)
      .populate('schoolId', 'name shortName')
      .populate('organizer', 'firstName lastName email')
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Count total events for pagination
    const totalEvents = await Event.countDocuments(query);
    
    res.status(200).json({
      events,
      totalPages: Math.ceil(totalEvents / limit),
      currentPage: parseInt(page),
      totalEvents
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id)
      .populate('schoolId', 'name shortName logo')
      .populate('organizer', 'firstName lastName email profilePicture')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('attendees.userId', 'firstName lastName email profilePicture');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check visibility permissions
    if (event.visibility !== 'public') {
      if (!req.user) {
        return res.status(403).json({ message: 'Not authorized to view this event' });
      }
      
      if (event.visibility === 'alumni_only' && req.user.role === 'guest') {
        return res.status(403).json({ message: 'This event is for alumni only' });
      }
      
      if (event.visibility === 'school_alumni_only' && 
          (!req.user.schoolId || req.user.schoolId.toString() !== event.schoolId._id.toString()) && 
          !['school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'This event is for alumni of a specific school only' });
      }
      
      if (event.visibility === 'invite_only' && 
          !event.attendees.some(a => a.userId._id.toString() === req.user.id) && 
          event.organizer._id.toString() !== req.user.id && 
          !['usosa_admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'This event is by invitation only' });
      }
    }
    
    res.status(200).json({ event });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// Create event
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      schoolId,
      capacity,
      registrationRequired,
      registrationDeadline,
      registrationFee,
      agenda,
      sponsors,
      status,
      visibility
    } = req.body;
    
    // Check if user has permission to create events
    if (!['alumni', 'school_admin', 'usosa_admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create events' });
    }
    
    // If school-specific event, check if school exists
    let isSchoolSpecific = false;
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      
      isSchoolSpecific = true;
      
      // If school admin, check if they are admin for this school
      if (req.user.role === 'school_admin') {
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to create events for this school' });
        }
      }
    }
    
    // Create new event
    const event = new Event({
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      organizer: req.user.id,
      schoolId: schoolId || null,
      isSchoolSpecific,
      capacity: capacity || null,
      registrationRequired: registrationRequired !== undefined ? registrationRequired : true,
      registrationDeadline: registrationDeadline || null,
      registrationFee: registrationFee || { amount: 0, currency: 'NGN' },
      agenda: agenda || [],
      sponsors: sponsors || [],
      status: status || 'draft',
      visibility: visibility || 'alumni_only',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    await event.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error during event creation' });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check authorization
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isCreator = event.createdBy.toString() === req.user.id;
    const isSchoolAdmin = req.user.role === 'school_admin' && event.schoolId && 
                         (await School.findById(event.schoolId)).adminUsers.includes(req.user.id);
    const isAdmin = ['usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isOrganizer && !isCreator && !isSchoolAdmin && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // If changing school, check if new school exists
    if (updateData.schoolId && updateData.schoolId !== event.schoolId?.toString()) {
      const school = await School.findById(updateData.schoolId);
      if (!school) {
        return res.status(404).json({ message: 'School not found' });
      }
      
      // If school admin, check if they are admin for the new school
      if (req.user.role === 'school_admin') {
        if (!school.adminUsers.includes(req.user.id)) {
          return res.status(403).json({ message: 'Not authorized to assign event to this school' });
        }
      }
      
      updateData.isSchoolSpecific = true;
    } else if (updateData.schoolId === null || updateData.schoolId === '') {
      updateData.schoolId = null;
      updateData.isSchoolSpecific = false;
    }
    
    // Update event fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy' && key !== 'attendees') {
        event[key] = updateData[key];
      }
    });
    
    event.updatedAt = Date.now();
    event.updatedBy = req.user.id;
    await event.save();
    
    res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error during event update' });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check authorization
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isCreator = event.createdBy.toString() === req.user.id;
    const isSchoolAdmin = req.user.role === 'school_admin' && event.schoolId && 
                         (await School.findById(event.schoolId)).adminUsers.includes(req.user.id);
    const isAdmin = ['usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isOrganizer && !isCreator && !isSchoolAdmin && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    // Delete event
    await Event.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error during event deletion' });
  }
};

// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event is published
    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Cannot register for an unpublished event' });
    }
    
    // Check if registration is required
    if (!event.registrationRequired) {
      return res.status(400).json({ message: 'Registration is not required for this event' });
    }
    
    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }
    
    // Check if event has reached capacity
    if (event.capacity && event.attendees.length >= event.capacity) {
      return res.status(400).json({ message: 'Event has reached maximum capacity' });
    }
    
    // Check if user is already registered
    if (event.attendees.some(a => a.userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    
    // Check visibility permissions
    if (event.visibility !== 'public') {
      if (event.visibility === 'alumni_only' && req.user.role === 'guest') {
        return res.status(403).json({ message: 'This event is for alumni only' });
      }
      
      if (event.visibility === 'school_alumni_only' && 
          (!req.user.schoolId || req.user.schoolId.toString() !== event.schoolId.toString())) {
        return res.status(403).json({ message: 'This event is for alumni of a specific school only' });
      }
      
      if (event.visibility === 'invite_only') {
        return res.status(403).json({ message: 'This event is by invitation only' });
      }
    }
    
    // Determine payment status
    let paymentStatus = 'not_applicable';
    if (event.registrationFee && event.registrationFee.amount > 0) {
      paymentStatus = 'pending';
    }
    
    // Add user to attendees
    event.attendees.push({
      userId: req.user.id,
      registeredAt: Date.now(),
      status: 'registered',
      paymentStatus
    });
    
    await event.save();
    
    res.status(200).json({
      message: 'Successfully registered for event',
      requiresPayment: paymentStatus === 'pending'
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error during event registration' });
  }
};

// Cancel registration
exports.cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is registered
    const attendeeIndex = event.attendees.findIndex(a => a.userId.toString() === req.user.id);
    if (attendeeIndex === -1) {
      return res.status(400).json({ message: 'You are not registered for this event' });
    }
    
    // Update attendee status
    event.attendees[attendeeIndex].status = 'cancelled';
    
    await event.save();
    
    res.status(200).json({
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error during registration cancellation' });
  }
};

// Update attendee status
exports.updateAttendeeStatus = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status, paymentStatus, paymentReference } = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check authorization
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isSchoolAdmin = req.user.role === 'school_admin' && event.schoolId && 
                         (await School.findById(event.schoolId)).adminUsers.includes(req.user.id);
    const isAdmin = ['usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isOrganizer && !isSchoolAdmin && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update attendee status' });
    }
    
    // Find attendee
    const attendeeIndex = event.attendees.findIndex(a => a.userId.toString() === userId);
    if (attendeeIndex === -1) {
      return res.status(404).json({ message: 'Attendee not found' });
    }
    
    // Update attendee fields
    if (status) {
      event.attendees[attendeeIndex].status = status;
    }
    
    if (paymentStatus) {
      event.attendees[attendeeIndex].paymentStatus = paymentStatus;
    }
    
    if (paymentReference) {
      event.attendees[attendeeIndex].paymentReference = paymentReference;
    }
    
    await event.save();
    
    res.status(200).json({
      message: 'Attendee status updated successfully'
    });
  } catch (error) {
    console.error('Update attendee status error:', error);
    res.status(500).json({ message: 'Server error during attendee status update' });
  }
};

// Invite user to event
exports.inviteToEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check authorization
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isCreator = event.createdBy.toString() === req.user.id;
    const isSchoolAdmin = req.user.role === 'school_admin' && event.schoolId && 
                         (await School.findById(event.schoolId)).adminUsers.includes(req.user.id);
    const isAdmin = ['usosa_admin', 'super_admin'].includes(req.user.role);
    
    if (!isOrganizer && !isCreator && !isSchoolAdmin && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to invite users to this event' });
    }
    
    // Verify users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ message: 'One or more users not found' });
    }
    
    // Add users to attendees if not already registered
    const existingUserIds = event.attendees.map(a => a.userId.toString());
    const newAttendees = [];
    
    for (const userId of userIds) {
      if (!existingUserIds.includes(userId)) {
        // Determine payment status
        let paymentStatus = 'not_applicable';
        if (event.registrationFee && event.registrationFee.amount > 0) {
          paymentStatus = 'pending';
        }
        
        event.attendees.push({
          userId,
          registeredAt: Date.now(),
          status: 'registered',
          paymentStatus
        });
        
        newAttendees.push(userId);
      }
    }
    
    await event.save();
    
    res.status(200).json({
      message: `Successfully invited ${newAttendees.length} users to the event`,
      newAttendees
    });
  } catch (error) {
    console.error('Invite to event error:', error);
    res.status(500).json({ message: 'Server error during event invitation' });
  }
};

// Upload event banner
exports.uploadEventBanner = async (req, res) => {
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
      
      const event = await Event.findById(id);
      if (!event) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check authorization
      const isOrganizer = event.organizer.toString() === req.user.id;
      const isCreator = event.createdBy.toString() === req.user.id;
      const isSchoolAdmin = req.user.role === 'school_admin' && event.schoolId && 
                           (await School.findById(event.schoolId)).adminUsers.includes(req.user.id);
      const isAdmin = ['usosa_admin', 'super_admin'].includes(req.user.role);
      
      if (!isOrganizer && !isCreator && !isSchoolAdmin && !isAdmin) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Not authorized to update this event' });
      }
      
      // Delete old banner if exists
      if (event.banner) {
        const oldBannerPath = path.join(__dirname, '../../', event.banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
      
      // Update event with new banner path
      const relativePath = path.join('uploads/events', req.file.filename);
      event.banner = relativePath;
      event.updatedAt = Date.now();
      event.updatedBy = req.user.id;
      await event.save();
      
      res.status(200).json({
        message: 'Event banner uploaded successfully',
        banner: relativePath
      });
    });
  } catch (error) {
    console.error('Upload event banner error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};
