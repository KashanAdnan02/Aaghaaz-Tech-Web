import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

// Routes
import authRoutes from './routes/auth.mjs';
import courseRoutes from './routes/course.mjs';
import studentRoutes from './routes/student.mjs';
import attendanceRoutes from './routes/attendance.mjs';

dotenv.config();

// IMPORTANT: Required environment variables for proper functioning:
// - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
// - CLOUDINARY_API_KEY:  Your Cloudinary API key
// - CLOUDINARY_API_SECRET: Your Cloudinary API secret
// Make sure these are set in your .env file to avoid upload timeouts

const app = express();

// Configure Cloudinary with better error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxpqgnxob',
    api_key: process.env.CLOUDINARY_API_KEY || '719765657819354',
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  // Test Cloudinary connection
  console.log('Cloudinary configuration:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxpqgnxob',
    api_key: process.env.CLOUDINARY_API_KEY ? '****' : '****', // Don't log actual keys
    api_secret: process.env.CLOUDINARY_API_SECRET ? '****' : '****', // Don't log actual secrets
  });

  // Ping Cloudinary to validate config
  cloudinary.api.ping()
    .then(result => console.log('Cloudinary connection successful:', result.status))
    .catch(error => console.error('Cloudinary connection error:', error));
} catch (error) {
  console.error('Error configuring Cloudinary:', error);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aaghaaz_lms')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
