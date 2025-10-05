import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Answer from '@/models/Answer';
import Question from '@/models/Question';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { content, author, questionId } = await request.json();

    // Validate required fields
    if (!content || !author || !questionId) {
      return NextResponse.json({ error: 'Content, author, and questionId are required' }, { status: 400 });
    }

    // Validate content length
    if (content.trim().length < 10) {
      return NextResponse.json({ error: 'Answer must be at least 10 characters long' }, { status: 400 });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Create new answer
    const answer = new Answer({
      content: content.trim(),
      author,
      questionId
    });

    await answer.save();

    return NextResponse.json({ 
      message: 'Answer posted successfully',
      answer: {
        _id: answer._id,
        content: answer.content,
        author: answer.author,
        questionId: answer.questionId,
        isAccepted: answer.isAccepted,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        createdAt: answer.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Post answer error:', error);
    return NextResponse.json({ error: 'Failed to post answer' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const answers = await Answer.find({ questionId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ answers }, { status: 200 });

  } catch (error) {
    console.error('Get answers error:', error);
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
  }
}