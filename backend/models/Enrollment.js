const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  enrolledAt: { type: Date, default: Date.now },
  droppedAt: { type: Date, default: null },
  grade: { type: String, default: null }
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

enrollmentSchema.post('save', async function (doc) {
  if (doc.status === 'active') {
    await mongoose.model('Course').findByIdAndUpdate(doc.course, { $inc: { enrolled: 1 } });
  }
});

enrollmentSchema.statics.isEnrolled = async function (studentId, courseId) {
  const e = await this.findOne({ student: studentId, course: courseId, status: 'active' });
  return !!e;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);