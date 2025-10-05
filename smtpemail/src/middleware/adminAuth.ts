import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    return decoded;
  } catch (error) {
    console.error('Authentication failed:', (error as Error).message);
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}