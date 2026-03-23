require('dotenv').config();
const connectDB = require('./config/db');
const Course = require('./models/Course');
const Student = require('./models/Student');

const courses = [
  {
    courseCode: 'CS101', title: 'Introduction to Computer Science',
    description: 'Fundamentals of computer science including algorithms, data structures, and problem-solving techniques using Python.',
    instructor: { name: 'Dr. Sarah Johnson', email: 'sarah@college.edu', designation: 'Associate Professor' },
    department: 'Computer Science', credits: 3,
    schedule: { days: ['Monday', 'Wednesday', 'Friday'], startTime: '09:00', endTime: '10:00', room: 'Room 101' },
    semester: 'Spring 2025', capacity: 50, enrolled: 32, difficulty: 'Beginner'
  },
  {
    courseCode: 'CS201', title: 'Data Structures and Algorithms',
    description: 'Advanced data structures including trees, graphs, heaps and efficient algorithms for sorting and dynamic programming.',
    instructor: { name: 'Prof. Michael Chen', email: 'mchen@college.edu', designation: 'Professor' },
    department: 'Computer Science', credits: 4,
    schedule: { days: ['Tuesday', 'Thursday'], startTime: '10:30', endTime: '12:00', room: 'Room 202' },
    semester: 'Spring 2025', capacity: 40, enrolled: 28, difficulty: 'Intermediate', prerequisites: ['CS101']
  },
  {
    courseCode: 'CS301', title: 'Web Development',
    description: 'Full-stack web development using HTML5, CSS3, JavaScript, Node.js and MongoDB. Build real-world applications.',
    instructor: { name: 'Dr. Emily Rodriguez', email: 'emily@college.edu', designation: 'Assistant Professor' },
    department: 'Computer Science', credits: 3,
    schedule: { days: ['Monday', 'Wednesday'], startTime: '14:00', endTime: '15:30', room: 'Lab 305' },
    semester: 'Spring 2025', capacity: 35, enrolled: 35, difficulty: 'Intermediate', prerequisites: ['CS101']
  },
  {
    courseCode: 'CS302', title: 'Database Systems',
    description: 'Relational and NoSQL databases, SQL, data modeling, normalization and indexing with MySQL and MongoDB.',
    instructor: { name: 'Dr. Karen Liu', email: 'kliu@college.edu', designation: 'Associate Professor' },
    department: 'Computer Science', credits: 3,
    schedule: { days: ['Monday', 'Wednesday'], startTime: '16:00', endTime: '17:30', room: 'Lab 303' },
    semester: 'Spring 2025', capacity: 35, enrolled: 20, difficulty: 'Intermediate', prerequisites: ['CS101']
  },
  {
    courseCode: 'CS401', title: 'Machine Learning',
    description: 'Machine learning algorithms, neural networks, deep learning and AI applications using Python and TensorFlow.',
    instructor: { name: 'Dr. Raj Patel', email: 'rpatel@college.edu', designation: 'Professor' },
    department: 'Computer Science', credits: 3,
    schedule: { days: ['Wednesday', 'Friday'], startTime: '11:00', endTime: '12:30', room: 'AI Lab 501' },
    semester: 'Spring 2025', capacity: 30, enrolled: 22, difficulty: 'Advanced', prerequisites: ['CS201', 'MATH201']
  },
  {
    courseCode: 'CS501', title: 'Cloud Computing and DevOps',
    description: 'Cloud platforms, containerization with Docker and Kubernetes, CI/CD pipelines and microservices architecture.',
    instructor: { name: 'Dr. Mark Thompson', email: 'mthompson@college.edu', designation: 'Assistant Professor' },
    department: 'Computer Science', credits: 3,
    schedule: { days: ['Wednesday', 'Friday'], startTime: '14:00', endTime: '15:30', room: 'Cloud Lab 601' },
    semester: 'Spring 2025', capacity: 25, enrolled: 10, difficulty: 'Advanced', prerequisites: ['CS301', 'CS302']
  },
  {
    courseCode: 'MATH101', title: 'Calculus I',
    description: 'Differential calculus covering limits, derivatives, and their applications in engineering and science.',
    instructor: { name: 'Prof. James Wilson', email: 'jwilson@college.edu', designation: 'Professor' },
    department: 'Mathematics', credits: 4,
    schedule: { days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], startTime: '08:00', endTime: '09:00', room: 'Math 102' },
    semester: 'Spring 2025', capacity: 60, enrolled: 48, difficulty: 'Intermediate'
  },
  {
    courseCode: 'MATH201', title: 'Calculus II',
    description: 'Integral calculus, infinite series, parametric equations and applications in engineering.',
    instructor: { name: 'Prof. James Wilson', email: 'jwilson@college.edu', designation: 'Professor' },
    department: 'Mathematics', credits: 4,
    schedule: { days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], startTime: '09:00', endTime: '10:00', room: 'Math 104' },
    semester: 'Spring 2025', capacity: 55, enrolled: 40, difficulty: 'Intermediate', prerequisites: ['MATH101']
  },
  {
    courseCode: 'MATH301', title: 'Linear Algebra',
    description: 'Vector spaces, linear transformations, matrices, eigenvalues and applications in computer graphics and ML.',
    instructor: { name: 'Prof. David Kim', email: 'dkim@college.edu', designation: 'Professor' },
    department: 'Mathematics', credits: 3,
    schedule: { days: ['Tuesday', 'Thursday', 'Friday'], startTime: '09:00', endTime: '10:00', room: 'Math 301' },
    semester: 'Spring 2025', capacity: 50, enrolled: 38, difficulty: 'Intermediate', prerequisites: ['MATH101']
  },
  {
    courseCode: 'PHYS201', title: 'Physics for Engineers',
    description: 'Mechanics, thermodynamics, waves and electromagnetism with engineering applications.',
    instructor: { name: 'Dr. Lisa Park', email: 'lpark@college.edu', designation: 'Associate Professor' },
    department: 'Physics', credits: 4,
    schedule: { days: ['Tuesday', 'Thursday'], startTime: '13:00', endTime: '14:30', room: 'Science 401' },
    semester: 'Spring 2025', capacity: 45, enrolled: 30, difficulty: 'Intermediate'
  },
  {
    courseCode: 'BUS101', title: 'Introduction to Business',
    description: 'Overview of management, marketing, finance and entrepreneurship in the modern economy.',
    instructor: { name: 'Prof. Angela Davis', email: 'adavis@college.edu', designation: 'Associate Professor' },
    department: 'Business', credits: 3,
    schedule: { days: ['Monday', 'Wednesday', 'Friday'], startTime: '10:00', endTime: '11:00', room: 'Business 201' },
    semester: 'Spring 2025', capacity: 80, enrolled: 55, difficulty: 'Beginner'
  },
  {
    courseCode: 'ENG201', title: 'Technical Writing',
    description: 'Professional writing skills for technical documents, reports and presentations in engineering contexts.',
    instructor: { name: 'Dr. Thomas Brown', email: 'tbrown@college.edu', designation: 'Assistant Professor' },
    department: 'English', credits: 2,
    schedule: { days: ['Tuesday', 'Thursday'], startTime: '15:00', endTime: '16:00', room: 'Humanities 103' },
    semester: 'Spring 2025', capacity: 30, enrolled: 18, difficulty: 'Beginner'
  }
];

async function seed() {
  try {
    await connectDB();
    await Course.deleteMany({});
    await Course.insertMany(courses);
    console.log('Inserted ' + courses.length + ' courses.');

    const exists = await Student.findOne({ email: 'demo@student.edu' });
    if (!exists) {
      await Student.create({
        fullName: 'Demo Student',
        email: 'demo@student.edu',
        password: 'password123',
        phone: '+91 9876543210',
        department: 'Computer Science',
        year: 2
      });
      console.log('Demo student created.');
    } else {
      console.log('Demo student already exists.');
    }

    console.log('\nDatabase seeded successfully.');
    console.log('Login: demo@student.edu');
    console.log('Password: password123\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed error: ' + err.message);
    process.exit(1);
  }
}

seed();