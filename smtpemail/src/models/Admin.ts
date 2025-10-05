import mongoose, { Document, Schema } from 'mongoose';

interface IAdmin extends Document {
  email: string;
  otp: string;
  otpExpires: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;