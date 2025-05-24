import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  cnic: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^\d{13}$/.test(v);
      },
      message: 'CNIC must be exactly 13 digits'
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'Female', 'female', 'other', 'Other', 'Male'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  guardianName: {
    type: String,
    required: true
  },
  guardianPhone: {
    type: String,
    required: true
  },
  guardianRelation: {
    type: String,
    required: true
  },
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Dropped'],
      default: 'Active'
    }
  }],
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Enrolled', 'Eliminated', 'Suspended'],
    default: 'Pending'
  },
  profilePicture: {
    type: String,
    default: ''
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
  rollId: {
    type: String,
    unique: true,
    sparse: true
  }
});

// Generate rollId before saving
studentSchema.pre('save', async function (next) {
  if (!this.rollId) {
    let isUnique = false;
    while (!isUnique) {
      const rollId = Math.floor(100000 + Math.random() * 900000).toString();
      const existingStudent = await this.constructor.findOne({ rollId });
      if (!existingStudent) {
        this.rollId = rollId;
        isUnique = true;
      }
    }
  }
  this.updatedAt = new Date();
  next();
});

// Method to check if student can access their account
studentSchema.methods.canAccessAccount = function () {
  return ['Enrolled'].includes(this.status);
};

const Student = mongoose.model('Student', studentSchema);

export default Student; 