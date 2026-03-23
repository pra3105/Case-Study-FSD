const express    = require('express');
const router     = express.Router();
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');

router.get('/', protect, async function(req, res) {
  try {
    var department = req.query.department;
    var semester   = req.query.semester;
    var difficulty = req.query.difficulty;
    var search     = req.query.search;
    var page  = parseInt(req.query.page)  || 1;
    var limit = parseInt(req.query.limit) || 9;

    var filter = { isActive: true };
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (semester)   filter.semester   = semester;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title:              { $regex: search, $options: 'i' } },
        { courseCode:         { $regex: search, $options: 'i' } },
        { 'instructor.name':  { $regex: search, $options: 'i' } },
        { description:        { $regex: search, $options: 'i' } }
      ];
    }

    var skip  = (page - 1) * limit;
    var total = await Course.countDocuments(filter);
    var courses = await Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    var enrolledIds = await Enrollment.find({
      student: req.student._id, status: 'active'
    }).distinct('course');

    var result = courses.map(function(c) {
      var obj = c.toJSON();
      obj.isEnrolled = enrolledIds.some(function(id) {
        return id.toString() === c._id.toString();
      });
      return obj;
    });

    var departments = await Course.distinct('department', { isActive: true });
    var semesters   = await Course.distinct('semester',   { isActive: true });

    res.status(200).json({
      success: true,
      total:   total,
      pages:   Math.ceil(total / limit),
      currentPage: page,
      filterOptions: {
        departments: departments.sort(),
        semesters:   semesters.sort()
      },
      courses: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching courses.' });
  }
});

router.get('/:id', protect, async function(req, res) {
  try {
    var course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    var isEnrolled = await Enrollment.isEnrolled(req.student._id, course._id);
    var obj = course.toJSON();
    obj.isEnrolled = isEnrolled;
    res.status(200).json({ success: true, course: obj });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching course.' });
  }
});

router.post('/', protect, async function(req, res) {
  try {
    var course = await Course.create(req.body);
    res.status(201).json({ success: true, message: 'Course created.', course: course });
  } catch (err) {
    if (err.name === 'ValidationError') {
      var msg = Object.values(err.errors).map(function(e) { return e.message; }).join('. ');
      return res.status(400).json({ success: false, message: msg });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Course code already exists.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating course.' });
  }
});

module.exports = router;