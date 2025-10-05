import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reply from '@/models/Reply';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const answerId = searchParams.get('answerId');

    if (!answerId) {
      return NextResponse.json({ error: 'answerId is required' }, { status: 400 });
    }

    const replies = await Reply.find({ answerId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ replies }, { status: 200 });
  } catch (error) {
    console.error('Get replies error:', error);
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { content, author, answerId, parentReplyId } = await request.json();

    if (!content || !author || !answerId) {
      return NextResponse.json({ error: 'content, author and answerId are required' }, { status: 400 });
    }

    const reply = await Reply.create({
      content: String(content).trim(),
      author,
      answerId,
      parentReplyId: parentReplyId || null
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }
}


