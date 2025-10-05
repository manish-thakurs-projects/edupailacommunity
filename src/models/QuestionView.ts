import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionView extends Document {
  questionId: mongoose.Types.ObjectId;
  ip: string;
  userAgent?: string;
  createdAt: Date;
}

const QuestionViewSchema: Schema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  ip: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

QuestionViewSchema.index({ questionId: 1, createdAt: -1 });

export default mongoose.models.QuestionView || mongoose.model<IQuestionView>('QuestionView', QuestionViewSchema);


