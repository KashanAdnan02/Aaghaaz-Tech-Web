import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      cnic,
      phoneNumber,
      dateOfBirth,
      expertise,
      profilePicture,
      location,
      languages,
      qualification,
      role
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { cnic }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          'Email already registered' : 
          'CNIC already registered'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      cnic,
      phoneNumber,
      dateOfBirth,
      expertise,
      profilePicture,
      location,
      languages,
      qualification,
      role: role || 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cnic: user.cnic,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        expertise: user.expertise,
        profilePicture: user.profilePicture,
        location: user.location,
        languages: user.languages,
        qualification: user.qualification,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cnic: user.cnic,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        expertise: user.expertise,
        profilePicture: user.profilePicture,
        location: user.location,
        languages: user.languages,
        qualification: user.qualification,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

export default router; 