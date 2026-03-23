const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: { type: String, trim: true },
  instructor: {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    designation: { type: String, trim: true }
  },
  department: { type: String, required: true, trim: true },
  credits: { type: Number, required: true, min: 1, max: 6 },
  schedule: {
    days: [{ type: String }],
    startTime: String,
    endTime: String,
    room: String
  },
  semester: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  enrolled: { type: Number, default: 0, min: 0 },
  prerequisites: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('availableSeats').get(function () {
  return this.capacity - this.enrolled;
});

courseSchema.virtual('isFull').get(function () {
  return this.enrolled >= this.capacity;
});

courseSchema.virtual('fillPercent').get(function () {
  return Math.round((this.enrolled / this.capacity) * 100);
});

module.exports = mongoose.model('Course', courseSchema);