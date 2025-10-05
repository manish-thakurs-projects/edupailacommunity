import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import User from '@/models/User';
import nodemailer from 'nodemailer';

// Load environment variables
require('dotenv').config({ path: '.env' });

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Generate login OTP email template
function generateLoginOTPEmailTemplate(otp: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            🔐 Login Code
          </h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
            Secure access to your account
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
            Hello ${userName}!
          </h2>
          
          <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
            You requested a login code for your account. Use the code below to sign in:
          </p>
          
          <!-- OTP Code -->
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              Your Login Code
            </p>
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong> for security reasons.
          </p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
              ⚠️ Security Notice: Never share this code with anyone. Our team will never ask for your verification code.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
          <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
            This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: otpCode, expiresAt, isUsed: false, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Login Code - Email Community',
      html: generateLoginOTPEmailTemplate(otpCode, user.name),
    });

    return NextResponse.json({ 
      message: 'Login OTP sent successfully', 
      expiresIn: 600 
    }, { status: 200 });

  } catch (error) {
    console.error('Send login OTP error:', error);
    return NextResponse.json({ error: 'Failed to send login OTP' }, { status: 500 });
  }
}
