import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture?: string;
  };
  tags: string[];
  isResolved: boolean;
  upvotes: number;
  downvotes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  author: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ isResolved: 1, createdAt: -1 });
QuestionSchema.index({ tags: 1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
