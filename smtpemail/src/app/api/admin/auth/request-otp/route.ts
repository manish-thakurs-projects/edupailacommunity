import { NextRequest, NextResponse } from 'next/server';
import { isEmail } from 'validator';
import connectDB from '@/lib/mongodb';
import { generateOTP, storeOTP } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  console.log('[admin/auth/request-otp] route invoked');
  try {
    const { email } = await request.json();

    // Validate email format
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await connectDB();

    // Generate OTP
    const otp = generateOTP();
    console.log(`[admin/auth/request-otp] Generated OTP: ${otp}`);

    // Store OTP temporarily (e.g., in a database or in-memory store)
    await storeOTP(email, otp);

    // Send OTP to the admin's email
    const emailSent = await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otp}`);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in request-otp:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}