import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import QuestionView from '@/models/QuestionView';
import Reply from '@/models/Reply';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const questionId = params.id;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Get question
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Increment view count and log view by IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0] : request.ip) || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await Promise.all([
      Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } }),
      QuestionView.create({ questionId, ip, userAgent })
    ]);

    // Get answers for this question
    const answers = await Answer.find({ questionId })
      .sort({ isAccepted: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      question,
      answers
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const questionId = params.id;
    const { isResolved } = await request.json();

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const question = await Question.findByIdAndUpdate(
      questionId,
      { isResolved },
      { new: true }
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Question updated successfully',
      question
    }, { status: 200 });
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const questionId = params.id;
    const { requesterEmail, requesterIsAdmin } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isOwner = requesterEmail && String(requesterEmail).toLowerCase() === String(question.author?.email).toLowerCase();
    const isAdmin = Boolean(requesterIsAdmin);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this question' }, { status: 403 });
    }

    // Find answers to cascade delete replies
    const answers = await Answer.find({ questionId: question._id }).select('_id');
    const answerIds = answers.map(a => a._id);

    await Promise.all([
      Reply.deleteMany({ answerId: { $in: answerIds } }),
      Answer.deleteMany({ questionId: question._id }),
      QuestionView.deleteMany({ questionId: question._id }),
      Question.findByIdAndDelete(question._id)
    ]);

    return NextResponse.json({ message: 'Question deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
