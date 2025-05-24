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
      modeOfDelivery,
      startingDate,
      outline,
      requirements,
      poster
    } = req.body;

    const course = new Course({
      name,
      days,
      timing,
      duration,
      price,
      modeOfDelivery,
      startingDate,
      outline,
      requirements,
      poster,
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

router.delete('/:id', maintenanceOfficeOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await course.deleteOne();
    res.json({ message: 'Course permanently deleted' });
  } catch (error) {
    res.status(500).json({
      message: 'Error permanently deleting course',
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
    // If no query params, return all courses as an array
    if (Object.keys(req.query).length === 0) {
      const courses = await Course.find({ isActive: true }).lean();
      return res.json(courses);
    }

    // Otherwise, use pagination/filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const query = { isActive: true };
    if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.mode) query.modeOfDelivery = req.query.mode;

    const courses = await Course.find(query)
      .select('name description days timing duration price modeOfDelivery startingDate outline requirements poster')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      courses,
      totalPages,
      currentPage: page,
      totalRecords: total,
      limit
    });
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
      isActive,
      startingDate,
      outline,
      requirements,
      poster
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
    if (startingDate) course.startingDate = startingDate;
    if (outline !== undefined) course.outline = outline;
    if (requirements !== undefined) course.requirements = requirements;
    if (poster !== undefined) course.poster = poster;

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

// Permanently delete a course (Admin only)


export default router; 