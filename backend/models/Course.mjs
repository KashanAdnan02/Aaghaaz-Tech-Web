import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  }],
  timing: {
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    }
  },
  duration: {
    type: Number, // Duration in weeks
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  modeOfDelivery: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid', 'Onsite'],
    required: true
  },
  outline: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
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
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  startingDate: {
    type: Date,
    required: true
  }
});

// Update the updatedAt timestamp before saving
courseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course; 