import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Answer from '@/models/Answer';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { answerId, voteType, userEmail } = await request.json();

    // Validate required fields
    if (!answerId || !voteType || !userEmail) {
      return NextResponse.json({ error: 'Answer ID, vote type and userEmail are required' }, { status: 400 });
    }

    // Validate vote type
    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type. Must be upvote or downvote' }, { status: 400 });
    }

    // Find the answer
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    const email = String(userEmail).toLowerCase();

    // Initialize arrays if missing (for older records)
    if (!Array.isArray(answer.likedBy)) answer.likedBy = [] as any;
    if (!Array.isArray(answer.unlikedBy)) answer.unlikedBy = [] as any;

    // Toggle logic: one action per user; switching removes previous
    if (voteType === 'upvote') {
      const hadUpvoted = answer.likedBy.includes(email);
      const hadDownvoted = answer.unlikedBy.includes(email);

      if (hadUpvoted) {
        // remove upvote
        answer.likedBy = answer.likedBy.filter(e => e !== email) as any;
      } else {
        // add upvote, remove downvote if present
        answer.likedBy.push(email as any);
        if (hadDownvoted) {
          answer.unlikedBy = answer.unlikedBy.filter(e => e !== email) as any;
        }
      }
    } else {
      const hadDownvoted = answer.unlikedBy.includes(email);
      const hadUpvoted = answer.likedBy.includes(email);

      if (hadDownvoted) {
        // remove downvote
        answer.unlikedBy = answer.unlikedBy.filter(e => e !== email) as any;
      } else {
        // add downvote, remove upvote if present
        answer.unlikedBy.push(email as any);
        if (hadUpvoted) {
          answer.likedBy = answer.likedBy.filter(e => e !== email) as any;
        }
      }
    }

    // Recalculate counts
    answer.upvotes = answer.likedBy.length;
    answer.downvotes = answer.unlikedBy.length;

    await answer.save();

    return NextResponse.json({ 
      message: 'Vote recorded successfully',
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      likedBy: answer.likedBy,
      unlikedBy: answer.unlikedBy
    }, { status: 200 });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
