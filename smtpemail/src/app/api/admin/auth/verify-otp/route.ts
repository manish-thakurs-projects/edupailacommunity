import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { validateOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  console.log('[admin/auth/verify-otp] route invoked');
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    await connectDB();

    // Validate the OTP
    const isValid = await validateOTP(email, otp);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Optionally, you can mark the OTP as used or delete it from the database here

    return NextResponse.json({ message: 'OTP verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Verify OTP error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}