import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reply from '@/models/Reply';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const replyId = params.id;
    const { requesterEmail, requesterIsAdmin } = await request.json();

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID is required' }, { status: 400 });
    }

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    const isOwner = requesterEmail && String(requesterEmail).toLowerCase() === String(reply.author?.email).toLowerCase();
    const isAdmin = Boolean(requesterIsAdmin);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this reply' }, { status: 403 });
    }

    await Reply.findByIdAndDelete(replyId);
    return NextResponse.json({ message: 'Reply deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete reply error:', error);
    return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
  }
}


