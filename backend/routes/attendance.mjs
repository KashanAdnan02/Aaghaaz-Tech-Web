import express from 'express';
import Attendance from '../models/Attendance.mjs';
import Student from '../models/Student.mjs';
import Course from '../models/Course.mjs';
import { adminOrMaintenance, maintenanceOfficeOnly } from '../middleware/roleAuth.mjs';
import mongoose from 'mongoose';
import { isAuthenticated, isTeacher } from '../middleware/auth.mjs';

const router = express.Router();

// Create new attendance record
router.post('/', maintenanceOfficeOnly, async (req, res) => {
  try {
    const { courseId, date, students } = req.body;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if attendance already exists for this course and date
    const existingAttendance = await Attendance.findOne({
      courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    // Create new attendance record
    const attendance = new Attendance({
      courseId,
      date: new Date(date),
      students: students.map(student => ({
        studentId: student.studentId,
        status: student.status,
        remarks: student.remarks || ''
      }))
    });

    await attendance.save();

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Get attendance records for a course
router.get('/course/:courseId', adminOrMaintenance, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const query = { courseId };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'students.studentId',
        select: 'firstName lastName rollId'
      })
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// Get attendance records for a student
router.get('/student/:studentId', adminOrMaintenance, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const query = { 'students.studentId': studentId };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name')
      .sort({ date: -1 });

    // Transform the data to focus on the specific student
    const studentAttendance = attendance.map(record => {
      const studentRecord = record.students.find(
        s => s.studentId.toString() === studentId
      );
      return {
        date: record.date,
        course: record.courseId,
        status: studentRecord.status,
        remarks: studentRecord.remarks
      };
    });

    res.json(studentAttendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      message: 'Error fetching student attendance',
      error: error.message
    });
  }
});

// Update attendance record
router.put('/:id', maintenanceOfficeOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { students } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance ID format' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Update student attendance records
    attendance.students = students.map(student => ({
      studentId: student.studentId,
      status: student.status,
      remarks: student.remarks || ''
    }));

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

// Get attendance statistics
router.get('/stats', adminOrMaintenance, async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    const query = {};
    if (courseId) {
      query.courseId = courseId;
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name')
      .populate('students.studentId', 'firstName lastName rollId');

    // Calculate statistics
    const stats = {
      totalClasses: attendance.length,
      totalStudents: attendance[0]?.students.length || 0,
      attendanceByStatus: {
        present: 0,
        absent: 0,
        late: 0
      },
      courseWiseStats: {}
    };

    attendance.forEach(record => {
      record.students.forEach(student => {
        stats.attendanceByStatus[student.status.toLowerCase()]++;

        // Course-wise statistics
        const courseName = record.courseId.name;
        if (!stats.courseWiseStats[courseName]) {
          stats.courseWiseStats[courseName] = {
            totalClasses: 0,
            attendanceByStatus: {
              present: 0,
              absent: 0,
              late: 0
            }
          };
        }
        stats.courseWiseStats[courseName].totalClasses++;
        stats.courseWiseStats[courseName].attendanceByStatus[student.status.toLowerCase()]++;
      });
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
});

// Get students for a specific course
router.get('/students/:courseId', isAuthenticated, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate('students');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance for a course
router.post('/mark', isAuthenticated, isTeacher, async (req, res) => {
  try {
    const { courseId, date, students } = req.body;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if attendance already exists for this date and course
    const existingAttendance = await Attendance.findOne({
      courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    // Create new attendance record
    const attendance = new Attendance({
      courseId,
      date: new Date(date),
      students: students.map(student => ({
        studentId: student.studentId,
        status: student.status,
        remarks: student.remarks || ''
      })),
      markedBy: req.user._id
    });

    await attendance.save();
    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Get all students for a specific course

// Get attendance for a specific student
router.get('/student/:studentId', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, courseId } = req.query;

    const query = {
      'students.studentId': req.params.studentId
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance by roll number
router.get('/roll/:rollId', isAuthenticated, async (req, res) => {
  try {
    const student = await Student.findOne({ rollId: req.params.rollId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { startDate, endDate, courseId } = req.query;

    const query = {
      'students.studentId': student._id
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update attendance status
router.put('/update/:attendanceId', isAuthenticated, isTeacher, async (req, res) => {
  try {
    const { studentId, status, remarks } = req.body;

    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const studentAttendance = attendance.students.find(
      s => s.studentId.toString() === studentId
    );

    if (!studentAttendance) {
      return res.status(404).json({ message: 'Student attendance record not found' });
    }

    studentAttendance.status = status;
    if (remarks) {
      studentAttendance.remarks = remarks;
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 