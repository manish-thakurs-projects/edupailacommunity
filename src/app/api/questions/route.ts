import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { title, content, author, tags } = await request.json();

    // Validate required fields
    if (!title || !content || !author?.name || !author?.email) {
      return NextResponse.json(
        { error: 'Title, content, and author information are required' },
        { status: 400 }
      );
    }

    // Create new question
    const question = new Question({
      title: title.trim(),
      content: content.trim(),
      author: {
        name: author.name.trim(),
        email: author.email.toLowerCase().trim(),
        profilePicture: author.profilePicture || ''
      },
      tags: tags ? tags.map((tag: string) => tag.trim().toLowerCase()).filter(Boolean) : []
    });

    await question.save();

    return NextResponse.json(
      { message: 'Question posted successfully', question },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const tag = searchParams.get('tag');
    const resolved = searchParams.get('resolved');

    // Build query
    const query: any = {};
    if (tag) query.tags = tag.toLowerCase();
    if (resolved !== null) query.isResolved = resolved === 'true';

    // Build sort
    let sort: any = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'popular') sort = { views: -1, createdAt: -1 };
    else if (sortBy === 'unresolved') sort = { isResolved: 1, createdAt: -1 };

    // Get questions with pagination
    const skip = (page - 1) * limit;
    const questions = await Question.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Question.countDocuments(query);

    return NextResponse.json({
      questions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalQuestions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
