import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
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
      validator: function(v) {
        return /^\d{13}$/.test(v);
      },
      message: 'CNIC must be exactly 13 digits'
    }
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  expertise: {
    type: [String],
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  location: {
    country: String,
    city: String
  },
  languages: [{
    type: String,
    trim: true
  }],
  qualification: {
    type: String,
    enum: ['Matric', 'Intermediate', 'Undergraduate', 'Graduate', 'Masters', 'PHD', 'Other'],
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'maintenance_office'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User; 