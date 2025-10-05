const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env — cannot create admin.');
  process.exit(1);
}

const emailArg = process.argv[2] || process.env.ADMIN_USERNAME;
const nameArg = process.argv[3] || 'Admin';

if (!emailArg || !emailArg.includes('@')) {
  console.error('Usage: node scripts\\create-admin-email.js admin@example.com "Optional Name"');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  name: { type: String, default: 'Admin' },
  role: { type: String, default: 'admin' },
}, { timestamps: true });

// Use existing model if present, target 'admins' collection
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema, 'admins');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({ email: emailArg });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      return process.exit(0);
    }

    const doc = await Admin.create({ email: emailArg, name: nameArg, role: 'admin' });
    console.log('Admin created:', { id: doc._id.toString(), email: doc.email });
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
}

run();