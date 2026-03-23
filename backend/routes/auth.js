const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const { protect, generateToken } = require('../middleware/auth');

router.post('/register', async function(req, res) {
  try {
    var fullName   = req.body.fullName;
    var email      = req.body.email;
    var password   = req.body.password;
    var phone      = req.body.phone;
    var department = req.body.department;
    var year       = req.body.year;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email and password are required.' });
    }

    var exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    var student = await Student.create({
      fullName:   fullName.trim(),
      email:      email.toLowerCase().trim(),
      password:   password,
      phone:      phone      ? phone.trim()      : undefined,
      department: department ? department.trim() : undefined,
      year:       year       ? parseInt(year)    : undefined
    });

    var token = generateToken(student._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token:   token,
      student: student.toPublicJSON()
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      var msg = Object.values(err.errors).map(function(e) { return e.message; }).join('. ');
      return res.status(400).json({ success: false, message: msg });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

router.post('/login', async function(req, res) {
  try {
    var email    = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    var student = await Student.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!student.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    var match = await student.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    var token = generateToken(student._id);
    res.status(200).json({
      success: true,
      message: 'Welcome back, ' + student.fullName + '.',
      token:   token,
      student: student.toPublicJSON()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

router.get('/me', protect, async function(req, res) {
  try {
    var student = await Student.findById(req.student._id);
    res.status(200).json({ success: true, student: student.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching profile.' });
  }
});

router.put('/profile', protect, async function(req, res) {
  try {
    var update = {};
    if (req.body.fullName)             update.fullName   = req.body.fullName.trim();
    if (req.body.phone !== undefined)  update.phone      = req.body.phone.trim();
    if (req.body.department !== undefined) update.department = req.body.department.trim();
    if (req.body.year !== undefined)   update.year       = parseInt(req.body.year);

    var student = await Student.findByIdAndUpdate(
      req.student._id, update, { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Profile updated.', student: student.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
});

router.put('/change-password', protect, async function(req, res) {
  try {
    var currentPassword = req.body.currentPassword;
    var newPassword     = req.body.newPassword;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    var student = await Student.findById(req.student._id).select('+password');
    var match   = await student.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    student.password = newPassword;
    await student.save();
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
});

module.exports = router;