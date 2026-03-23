const express    = require('express');
const router     = express.Router();
const Enrollment = require('../models/Enrollment');
const Course     = require('../models/Course');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, async function(req, res) {
  try {
    var all       = await Enrollment.find({ student: req.student._id }).populate('course');
    var active    = all.filter(function(e) { return e.status === 'active'; });
    var completed = all.filter(function(e) { return e.status === 'completed'; });
    var dropped   = all.filter(function(e) { return e.status === 'dropped'; });
    var totalCredits = active.reduce(function(s, e) {
      return s + (e.course ? e.course.credits : 0);
    }, 0);

    res.status(200).json({
      success: true,
      stats: {
        active:       active.length,
        completed:    completed.length,
        dropped:      dropped.length,
        totalCredits: totalCredits,
        recent: active.slice(0, 3).map(function(e) {
          return {
            courseTitle: e.course ? e.course.title     : '',
            courseCode:  e.course ? e.course.courseCode : '',
            enrolledAt:  e.enrolledAt
          };
        })
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching stats.' });
  }
});

router.get('/', protect, async function(req, res) {
  try {
    var filter = { student: req.student._id };
    if (req.query.status) filter.status = req.query.status;

    var enrollments = await Enrollment.find(filter).populate('course').sort({ enrolledAt: -1 });

    var stats = {
      total:    enrollments.length,
      active:   enrollments.filter(function(e) { return e.status === 'active'; }).length,
      dropped:  enrollments.filter(function(e) { return e.status === 'dropped'; }).length,
      completed:enrollments.filter(function(e) { return e.status === 'completed'; }).length,
      totalCredits: enrollments.filter(function(e) { return e.status === 'active'; })
        .reduce(function(s, e) { return s + (e.course ? e.course.credits : 0); }, 0)
    };

    res.status(200).json({ success: true, stats: stats, enrollments: enrollments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching enrollments.' });
  }
});

router.post('/:courseId', protect, async function(req, res) {
  try {
    var course = await Course.findById(req.params.courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    var existing = await Enrollment.findOne({
      student: req.student._id, course: course._id
    });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({ success: false, message: 'You are already enrolled in this course.' });
      }
      if (existing.status === 'dropped') {
        if (course.isFull) {
          return res.status(400).json({ success: false, message: 'Course is full.' });
        }
        existing.status     = 'active';
        existing.enrolledAt = new Date();
        existing.droppedAt  = null;
        await existing.save();
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolled: 1 } });
        var updated = await Enrollment.findById(existing._id).populate('course');
        return res.status(200).json({
          success: true,
          message: 'Re-enrolled in "' + course.title + '".',
          enrollment: updated
        });
      }
    }

    if (course.isFull) {
      return res.status(400).json({ success: false, message: 'Course is full. No seats available.' });
    }

    var creditCheck = await Enrollment.aggregate([
      { $match: { student: req.student._id, status: 'active' } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $group: { _id: null, total: { $sum: '$c.credits' } } }
    ]);
    var usedCredits = creditCheck.length > 0 ? creditCheck[0].total : 0;
    if (usedCredits + course.credits > 24) {
      return res.status(400).json({
        success: false,
        message: 'Exceeds 24 credit limit. Current: ' + usedCredits + ' credits.'
      });
    }

    var enrollment = await Enrollment.create({
      student: req.student._id,
      course:  course._id
    });
    var populated = await Enrollment.findById(enrollment._id).populate('course');

    res.status(201).json({
      success: true,
      message: 'Enrolled in "' + course.title + '" successfully.',
      enrollment: populated
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already enrolled.' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during enrollment.' });
  }
});

router.delete('/:courseId', protect, async function(req, res) {
  try {
    var enrollment = await Enrollment.findOne({
      student: req.student._id,
      course:  req.params.courseId,
      status:  'active'
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Active enrollment not found.' });
    }

    enrollment.status    = 'dropped';
    enrollment.droppedAt = new Date();
    await enrollment.save();
    await Course.findByIdAndUpdate(req.params.courseId, { $inc: { enrolled: -1 } });

    res.status(200).json({ success: true, message: 'Course dropped successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Error dropping course.' });
  }
});

module.exports = router;