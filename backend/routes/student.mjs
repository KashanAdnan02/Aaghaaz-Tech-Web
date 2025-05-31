import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.mjs';
import { adminOrMaintenance, maintenanceOfficeOnly } from '../middleware/roleAuth.mjs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import Course from '../models/Course.mjs';
import fs from 'fs';
import path from 'path';
const { jsPDF } = await import('jspdf');
import dotenv from 'dotenv';
import winston from 'winston';
import QRCode from 'qrcode';
dotenv.config();
const   router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file provided or invalid file format');
    }

    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Upload to Cloudinary with improved timeout and options
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'student_profiles',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [
        { width: 500, height: 500, crop: 'fill' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
      timeout: 120000, // 2 minute timeout instead of default
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      async: false
    });

    if (!result || !result.secure_url) {
      throw new Error('Failed to get secure URL from Cloudinary');
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);

    // If it's a timeout error, provide a clearer message
    if (error.http_code === 499 || error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error('Image upload timed out. Please try with a smaller image or check your network connection.');
    }

    throw new Error(`Error uploading image to Cloudinary: ${error.message}`);
  }
};

// Helper function to compress image
const compressImage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Upload to Cloudinary with compression
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, {
      folder: 'compressed_images',
      resource_type: 'image',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto:low', fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error compressing image:', error);
    return imageUrl; // Return original URL if compression fails
  }
};

// Register new student (Admin or Maintenance Office only)
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      cnic,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      guardianRelation,
      enrolledCourses
    } = req.body;

    // Parse address object if it's a string
    let parsedAddress = address;
    // console.log(parsedAddress);

    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        console.error('Error parsing address:', e);
        // Default to empty address object if parsing fails
        parsedAddress = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }
    }

    // Parse and validate enrolled courses
    let parsedCourses = [];
    if (enrolledCourses) {
      try {
        let courseIds = [];
        if (typeof enrolledCourses === 'string') {
          courseIds = JSON.parse(enrolledCourses);
        } else if (Array.isArray(enrolledCourses)) {
          courseIds = enrolledCourses;
        }

        // Validate that all course IDs exist
        const validCourses = await Course.find({
          _id: { $in: courseIds }
        });

        if (validCourses.length !== courseIds.length) {
          return res.status(400).json({
            message: 'One or more selected courses do not exist'
          });
        }

        parsedCourses = courseIds.map(courseId => ({
          courseId,
          enrollmentDate: new Date(),
          status: 'Active'
        }));
      } catch (e) {
        console.error('Error parsing enrolled courses:', e);
        return res.status(400).json({
          message: 'Invalid course selection format'
        });
      }
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { email },
        { cnic }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        message: existingStudent.email === email ?
          'Email already registered' :
          'CNIC already registered'
      });
    }

    // Upload profile picture if provided
    let profilePictureUrl = '';
    if (req.file) {
      profilePictureUrl = await uploadToCloudinary(req.file);
    }

    // Compress profile picture if exists
    let compressedProfileUrl = profilePictureUrl;
    if (profilePictureUrl) {
      compressedProfileUrl = await compressImage(profilePictureUrl);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student with Pending status
    const student = new Student({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      cnic,
      phoneNumber,
      dateOfBirth,
      gender,
      address: parsedAddress,
      guardianName,
      guardianPhone,
      guardianRelation,
      enrolledCourses: parsedCourses,
      profilePicture: compressedProfileUrl,
      status: 'Pending'
    });

    await student.save();

    // Generate and send ID card
    try {
      // Create PDF using jsPDF with increased width
      const doc = new jsPDF({
        unit: 'pt',
        format: [400, 900],
        orientation: 'landscape'
      });

      // Title (centered)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(0, 204, 204); // #00cccc
      doc.text('Aaghaaz Tech', 450, 50, { align: 'center' });
      doc.setFontSize(20);
      doc.text('Student ID Card', 450, 85, { align: 'center' });

      // Left section: Personal and Guardian Info
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      let y = 140;
      doc.text(`Name: ${student.firstName} ${student.lastName}`, 40, y);
      y += 25;
      doc.text(`Roll ID: ${student.rollId || 'N/A'}`, 40, y);
      y += 25;
      doc.text(`CNIC: ${student.cnic}`, 40, y);
      y += 25;
      doc.text(`Phone: ${student.phoneNumber}`, 40, y);
      y += 35;
      // Guardian Information heading in #00cccc
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 204, 204);
      doc.text('Guardian Information:', 40, y);
      y += 25;
      // Guardian info in black
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${student.guardianName || 'N/A'}`, 40, y);
      y += 25;
      doc.text(`Phone: ${student.guardianPhone || 'N/A'}`, 40, y);

      // Right section: Student info, Course, QR code
      let rightY = 140;
      const rightX = 350;
      doc.text(`Email: ${student.email}`, rightX, rightY);
      rightY += 25;
      doc.text(`Gender: ${student.gender || 'N/A'}`, rightX, rightY);
      rightY += 25;
      doc.text(`Status: ${student.status}`, rightX, rightY);
      rightY += 25;
      const enrollmentDateRight = student.enrolledCourses && student.enrolledCourses[0]?.enrollmentDate ? new Date(student.enrolledCourses[0].enrollmentDate).toLocaleDateString() : 'N/A';
      doc.text(`Enrollment Date: ${enrollmentDateRight}`, rightX, rightY);
      rightY += 25;
      doc.text(`Relation: ${student.guardianRelation || 'N/A'}`, rightX, rightY);
      rightY += 25;
      // Add Course
      const courseName = student.enrolledCourses && student.enrolledCourses[0]?.courseId?.name ? student.enrolledCourses[0].courseId.name : 'N/A';
      doc.text(`Course: ${courseName}`, rightX, rightY);

      // Center the QR code vertically in the right section
      const qrSectionTop = 140;
      const qrSectionHeight = 200;
      const qrCodeSize = 120;
      const qrCodeY = qrSectionTop + (qrSectionHeight - qrCodeSize) / 2;
      try {
        const qrData = student._id && student.email ? `${student._id}|${student.email}` : 'AaghaazTech';
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: qrCodeSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        doc.addImage(qrCodeDataUrl, 'PNG', 720, qrCodeY, qrCodeSize, qrCodeSize);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }

      // Generate PDF buffer (no compression)
      const idCardPdfBuffer = doc.output('arraybuffer');

      // Configure email transporter
      // console.log('SMTP Configuration:', {
      //   host: process.env.SMTP_HOST,
      //   port: process.env.SMTP_PORT,
      //   user: process.env.SMTP_USER,
      //   from: process.env.SMTP_FROM,
      //   // Don't log the password for security
      //   hasPassword: !!process.env.SMTP_PASS
      // });

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        debug: false, // Disable debug logs
        logger: false  // Disable logger
      });

      // Verify SMTP connection configuration
      try {
        await transporter.verify();
        // console.log('SMTP connection verified successfully');
      } catch (error) {
        console.error('SMTP connection verification failed:', error);
        throw new Error(`SMTP configuration error: ${error.message}`);
      }

      // Send email with PDF (no compression)
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: student.email,
          subject: 'Welcome to Aaghaaz Tech - Your Student ID Card',
          text: `Dear ${student.firstName},\n\nWelcome to Aaghaaz Tech! Your registration has been received and is pending approval.\n\nPlease find your student ID card attached. You will need this ID card for attendance and other purposes.\n\nBest regards,\nAaghaaz Tech Team`,
          attachments: [{
            filename: 'student_id_card.pdf',
            content: Buffer.from(idCardPdfBuffer),
            contentType: 'application/pdf'
          }]
        });
        // console.log('Email sent successfully to:', student.email);
      } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating/sending ID card:', error);
      // Don't fail the registration if ID card generation fails
    } console.log(student);


    res.status(201).json({
      message: 'Registered successfully. You are in pending approval. so please go to the campus office to get your card and verify!',
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        cnic: student.cnic,
        phoneNumber: student.phoneNumber,
        gender: student.gender,
        address: student.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianRelation: student.guardianRelation,
        status: student.status,
        profilePicture: student.profilePicture,
        rollId: student.rollId
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({
      message: 'Error registering student',
      error: error.message
    });
  }
});

// Student login (Public)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if student can access their account
    if (!student.canAccessAccount()) {
      return res.status(403).json({
        message: 'Your account is not active. Please contact the administration for more information.',
        status: student.status
      });
    }

    const token = jwt.sign(
      {
        studentId: student._id,
        role: 'student'
      },
      process.env.JWT_SECRET || '121212',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        status: student.status,
        enrolledCourses: student.enrolledCourses
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error logging in',
      error: error.message
    });
  }
});

// Create a new student (Maintenance Office only)
router.post('/', adminOrMaintenance, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      address,
      emergencyContact,
      enrollmentDate,
      status = 'active'
    } = req.body;

    // Check if student with email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const student = new Student({
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      address,
      emergencyContact,
      enrollmentDate,
      status
    });

    await student.save();

    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating student',
      error: error.message
    });
  }
});

// Get student counts for dashboard
router.get('/count', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const pendingStudents = await Student.countDocuments({ status: 'Pending' });
    const enrolledStudents = await Student.countDocuments({ status: 'Enrolled' });
    const suspendedStudents = await Student.countDocuments({ status: 'Suspended' });

    res.json({
      total: totalStudents,
      pending: pendingStudents,
      enrolled: enrolledStudents,
      suspended: suspendedStudents
    });
  } catch (error) {
    console.error('Error fetching student counts:', error);
    res.status(500).json({ message: 'Error fetching student counts' });
  }
});

// Get enrolled students count or list (Admin or Maintenance Office)
router.get('/enrolled', async (req, res) => {
  try {
    // If count is requested
    if (req.query.count === 'true') {
      const count = await Student.countDocuments({ status: 'Enrolled' });
      return res.json({ count });
    }

    // Otherwise return the list of enrolled students
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build search query
    const query = { status: 'Enrolled' };
    if (search) {
      query.$and = [
        { status: 'Enrolled' },
        {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { cnic: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalRecords = await Student.countDocuments(query);

    // Create sort object
    const sortObject = {};
    sortObject[sortField] = sortOrder;

    // Fetch enrolled students with pagination, search, and sorting
    const students = await Student.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'name days timing modeOfDelivery duration price'
      })
      .select('-password'); // Exclude password from response

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      students,
      totalPages,
      currentPage: page,
      totalRecords,
      limit,
      sortField,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc'
    });
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).json({
      message: 'Error fetching enrolled students',
      error: error.message
    });
  }
});

// Get a specific student (Admin or Maintenance Office)
router.get('/:id', adminOrMaintenance, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(req.params.id)
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'name days timing modeOfDelivery duration price'
      })
      .select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching student',
      error: error.message
    });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const students = await Student.find({
      'enrolledCourses.courseId': req.params.courseId,
      'enrolledCourses.status': 'Active',
      status: 'Enrolled'
    }).select('-password');
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias for compatibility with frontend
router.get('/enrolled/course/:courseId', async (req, res) => {
  try {
    const students = await Student.find({
      'enrolledCourses.courseId': req.params.courseId,
      'enrolledCourses.status': 'Active',
      status: 'Enrolled'
    }).select('-password');
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a student (Maintenance Office only)
router.put('/:id', adminOrMaintenance, upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      address,
      guardianName,
      guardianPhone,
      guardianRelation,
      enrolledCourses,
      status
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Parse address object if it's a string
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        console.error('Error parsing address:', e);
        // Default to empty address object if parsing fails
        parsedAddress = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }
    }

    // Parse and validate enrolled courses
    let parsedCourses = [];
    if (enrolledCourses) {
      try {
        let courseIds = [];
        if (typeof enrolledCourses === 'string') {
          courseIds = JSON.parse(enrolledCourses);
        } else if (Array.isArray(enrolledCourses)) {
          courseIds = enrolledCourses;
        }

        // Validate that all course IDs exist
        const validCourses = await Course.find({
          _id: { $in: courseIds }
        });

        if (validCourses.length !== courseIds.length) {
          return res.status(400).json({
            message: 'One or more selected courses do not exist'
          });
        }

        // Format courses in the correct structure
        parsedCourses = courseIds.map(courseId => ({
          courseId,
          enrollmentDate: new Date(),
          status: 'Active'
        }));
      } catch (e) {
        console.error('Error parsing enrolled courses:', e);
        return res.status(400).json({
          message: 'Invalid course selection format'
        });
      }
    }

    // Upload new profile picture if provided
    if (req.file) {
      const profilePictureUrl = await uploadToCloudinary(req.file);
      student.profilePicture = profilePictureUrl;
    }

    // Update fields if provided
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (email) student.email = email;
    if (phoneNumber) student.phoneNumber = phoneNumber;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (parsedAddress) student.address = parsedAddress;
    if (guardianName) student.guardianName = guardianName;
    if (guardianPhone) student.guardianPhone = guardianPhone;
    if (guardianRelation) student.guardianRelation = guardianRelation;
    if (parsedCourses.length > 0) student.enrolledCourses = parsedCourses;
    if (status) student.status = status;

    await student.save();

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      message: 'Error updating student',
      error: error.message
    });
  }
});

// Delete a student (Maintenance Office only)
router.delete('/:id', adminOrMaintenance, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.deleteOne();

    res.json({
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// Route to send ID card via email
router.post('/send-id-card', upload.single('pdf'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const pdfBuffer = req.file.buffer;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      // Configure your email service here
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: student.email,
      subject: 'Your Student ID Card',
      text: `Dear ${student.firstName},\n\nPlease find your student ID card attached.\n\nBest regards,\nAaghaaz Tech`,
      attachments: [{
        filename: 'id_card.pdf',
        content: pdfBuffer
      }]
    });

    res.json({ message: 'ID card sent successfully' });
  } catch (error) {
    console.error('Error sending ID card:', error);
    res.status(500).json({ message: 'Error sending ID card' });
  }
});

// Get all students with filters (Admin or Maintenance Office)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const courseId = req.query.courseId;
    const city = req.query.city;

    // Build search query
    const query = {};
    
    // Add search conditions
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Add course filter
    if (courseId) {
      query['enrolledCourses.courseId'] = courseId;
    }

    // Add city filter
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalRecords = await Student.countDocuments(query);

    // Fetch students with pagination and filters
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'name days timing modeOfDelivery duration'
      })
      .select('-password'); // Exclude password from response

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      students,
      totalPages,
      currentPage: page,
      totalRecords,
      limit
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Export students to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: 'enrolledCourses.courseId',
        select: 'name days timing modeOfDelivery duration price'
      })
      .select('-password');

    // Convert students to CSV format
    const headers = [
      'Roll ID',
      'First Name',
      'Last Name',
      'Email',
      'CNIC',
      'Phone Number',
      'Date of Birth',
      'Gender',
      'Address',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Relation',
      'Status',
      'Enrolled Courses',
      'Enrollment Date'
    ];

    const csvData = students.map(student => {
      const enrolledCourses = student.enrolledCourses
        .map(course => `${course.courseId?.name || 'N/A'} (${course.status})`)
        .join('; ');

      return [
        student.rollId || 'N/A',
        student.firstName || 'N/A',
        student.lastName || 'N/A',
        student.email || 'N/A',
        student.cnic || 'N/A',
        student.phoneNumber || 'N/A',
        student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        student.gender || 'N/A',
        `${student.address?.street || ''}, ${student.address?.city || ''}, ${student.address?.state || ''}, ${student.address?.zipCode || ''}, ${student.address?.country || ''}`,
        student.guardianName || 'N/A',
        student.guardianPhone || 'N/A',
        student.guardianRelation || 'N/A',
        student.status || 'N/A',
        enrolledCourses,
        student.enrolledCourses[0]?.enrollmentDate ? new Date(student.enrolledCourses[0].enrollmentDate).toLocaleDateString() : 'N/A'
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');

    // Send CSV file
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting students to CSV:', error);
    res.status(500).json({
      message: 'Error exporting students to CSV',
      error: error.message
    });
  }
});


export default router; 