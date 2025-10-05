const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('⚠️  MONGODB_URI not found in environment variables.');
  console.log('📝 This is normal for demo mode. To enable full functionality:');
  console.log('   1. Set up MongoDB Atlas (free tier available)');
  console.log('   2. Update MONGODB_URI in .env');
  console.log('   3. Run this script again');
  console.log('');
  console.log('🎯 The application will work in demo mode without a database.');
  process.exit(0);
}

// Admin Schema
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME,
      password: hashedPassword
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Username:', process.env.ADMIN_USERNAME);
    console.log('Password:', process.env.ADMIN_PASSWORD);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();