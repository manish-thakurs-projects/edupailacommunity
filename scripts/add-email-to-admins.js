// Run: node scripts\add-email-to-admins.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env — cannot run migration.');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema({}, { strict: false, collection: 'admins' });
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const admins = await Admin.find({ $or: [{ email: { $exists: false } }, { email: null }] }).lean();
    if (!admins.length) {
      console.log('No admins missing email field found.');
      return process.exit(0);
    }

    let updated = 0;
    for (const a of admins) {
      const username = a.username || a._doc?.username;
      if (username && typeof username === 'string' && username.includes('@')) {
        await Admin.updateOne({ _id: a._id }, { $set: { email: username } });
        console.log('Updated admin', a._id.toString(), 'email <-', username);
        updated++;
      } else {
        console.log('Skipping admin', a._id.toString(), 'no email-like username:', username);
      }
    }

    console.log(`Migration complete — updated ${updated} admin(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message || err);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
}

run();