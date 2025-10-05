import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture: string;
  };
  questionId: mongoose.Types.ObjectId;
  isAccepted: boolean;
  upvotes: number;
  downvotes: number;
  likedBy: string[];
  unlikedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema: Schema = new Schema({
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    trim: true,
    minlength: [10, 'Answer must be at least 10 characters long']
  },
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Author email is required'],
      lowercase: true,
      trim: true
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question ID is required']
  },
  isAccepted: {
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
  likedBy: {
    type: [String],
    default: []
  },
  unlikedBy: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for efficient querying
AnswerSchema.index({ questionId: 1, createdAt: -1 });

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema);