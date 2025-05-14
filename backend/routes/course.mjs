import express from 'express';
import Course from '../models/Course.mjs';
import { maintenanceOfficeOnly } from '../middleware/roleAuth.mjs';

const router = express.Router();

// Create a new course (Admin only)
router.post('/', maintenanceOfficeOnly, async (req, res) => {
  try {
    const {
      name,
      days,
      timing,
      duration,
      price,
      modeOfDelivery
    } = req.body;

    const course = new Course({
      name,
      days,
      timing,
      duration,
      price,
      modeOfDelivery,
      createdBy: req.user.userId
    });

    await course.save();

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating course',
      error: error.message
    });
  }
});

// Get course counts for dashboard
router.get('/count', async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    // const activeCourses = await Course.countDocuments({ isActive: true });
    // const inactiveCourses = await Course.countDocuments({ isActive: false });

    // // Get courses grouped by mode of delivery
    // const coursesByMode = await Course.aggregate([
    //   { $group: { _id: '$modeOfDelivery', count: { $sum: 1 } } }
    // ]);

    // const modeDelivery = {};
    // coursesByMode.forEach(item => {
    //   modeDelivery[item._id] = item.count;
    // });

    res.json({
      total: totalCourses,
      // active: activeCourses,
      // inactive: inactiveCourses,
      // modeDelivery
    });
  } catch (error) {
    console.error('Error fetching course counts:', error);
    res.status(500).json({ message: 'Error fetching course counts' });
  }
});

// Get all courses (Public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('createdBy', 'firstName lastName email');

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Get a specific course (Public)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// Update a course (Admin only)
router.put('/:id', maintenanceOfficeOnly, async (req, res) => {
  try {
    const {
      name,
      days,
      timing,
      duration,
      price,
      modeOfDelivery,
      isActive
    } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update fields
    if (name) course.name = name;
    if (days) course.days = days;
    if (timing) course.timing = timing;
    if (duration) course.duration = duration;
    if (price) course.price = price;
    if (modeOfDelivery) course.modeOfDelivery = modeOfDelivery;
    if (typeof isActive === 'boolean') course.isActive = isActive;

    await course.save();

    res.json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating course',
      error: error.message
    });
  }
});

// Delete a course (Admin only)
router.delete('/:id', maintenanceOfficeOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting course',
      error: error.message
    });
  }
});

export default router; 