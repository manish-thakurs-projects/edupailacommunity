import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Answer from '@/models/Answer';
import Reply from '@/models/Reply';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const answerId = params.id;
    const { requesterEmail, requesterIsAdmin } = await request.json();

    if (!answerId) {
      return NextResponse.json({ error: 'Answer ID is required' }, { status: 400 });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    const isOwner = requesterEmail && String(requesterEmail).toLowerCase() === String(answer.author?.email).toLowerCase();
    const isAdmin = Boolean(requesterIsAdmin);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this answer' }, { status: 403 });
    }

    await Promise.all([
      Reply.deleteMany({ answerId }),
      Answer.findByIdAndDelete(answerId)
    ]);

    return NextResponse.json({ message: 'Answer deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete answer error:', error);
    return NextResponse.json({ error: 'Failed to delete answer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const answerId = params.id;
    const { isAccepted } = await request.json();

    if (!answerId) {
      return NextResponse.json(
        { error: 'Answer ID is required' },
        { status: 400 }
      );
    }

    // If accepting an answer, unaccept all other answers for the same question
    if (isAccepted) {
      const answer = await Answer.findById(answerId);
      if (answer) {
        await Answer.updateMany(
          { questionId: answer.questionId, _id: { $ne: answerId } },
          { isAccepted: false }
        );
      }
    }

    const answer = await Answer.findByIdAndUpdate(
      answerId,
      { isAccepted },
      { new: true }
    );

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Answer updated successfully',
      answer
    }, { status: 200 });
  } catch (error) {
    console.error('Update answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
