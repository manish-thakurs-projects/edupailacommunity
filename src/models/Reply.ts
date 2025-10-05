import mongoose, { Schema, Document } from 'mongoose';

export interface IReply extends Document {
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture: string;
  };
  answerId: mongoose.Types.ObjectId;
  parentReplyId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema: Schema = new Schema({
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true,
    minlength: [1, 'Reply must not be empty']
  },
  author: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    profilePicture: { type: String, default: '' }
  },
  answerId: { type: Schema.Types.ObjectId, ref: 'Answer', required: true, index: true },
  parentReplyId: { type: Schema.Types.ObjectId, ref: 'Reply', default: null, index: true }
}, { timestamps: true });

ReplySchema.index({ answerId: 1, createdAt: 1 });

export default mongoose.models.Reply || mongoose.model<IReply>('Reply', ReplySchema);


