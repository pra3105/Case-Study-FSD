const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
  year: { type: Number, min: 1, max: 5 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isNew && !this.studentId) {
    const yr = new Date().getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 90000) + 10000;
    this.studentId = 'STU' + yr + rand;
  }
  next();
});

studentSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

studentSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    studentId: this.studentId,
    phone: this.phone,
    department: this.department,
    year: this.year,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Student', studentSchema);