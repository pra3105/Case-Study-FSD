const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);
    if (!student) return res.status(401).json({ success: false, message: 'Student not found.' });
    if (!student.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });
    req.student = student;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token.' });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = { protect, generateToken };