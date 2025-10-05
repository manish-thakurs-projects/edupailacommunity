import mongoose, { Document, Schema } from 'mongoose';

export interface IEmail extends Document {
  subject: string;
  content: string;
  attachments: string[];
  videoLinks: string[];
  recipients: string[];
  sentBy: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema: Schema = new Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  attachments: [{
    type: String
  }],
  videoLinks: [{
    type: String
  }],
  recipients: [{
    type: String,
    required: true
  }],
  sentBy: {
    type: String,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.Email || mongoose.model<IEmail>('Email', EmailSchema);