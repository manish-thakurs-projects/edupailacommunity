import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import nodemailer from 'nodemailer';

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

// Generate OTP email template with black and white theme
function generateOTPEmailTemplate(otp: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #000000;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
        }
        .container {
          background: white;
          border-radius: 8px;
          border: 2px solid #000000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: #000000;
          color: white;
          padding: 30px;
          text-align: center;
          border-bottom: 2px solid #000000;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .otp-code {
          background: #f8f8f8;
          border: 2px solid #000000;
          border-radius: 6px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
        }
        .otp-number {
          font-size: 36px;
          font-weight: bold;
          color: #000000;
          letter-spacing: 6px;
          margin: 15px 0;
          font-family: 'Courier New', monospace;
        }
        .footer {
          background: #f0f0f0;
          padding: 20px;
          text-align: center;
          color: #333333;
          font-size: 14px;
          border-top: 1px solid #dddddd;
        }
        .warning {
          background: #f0f0f0;
          border: 1px solid #000000;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #000000;
        }
        .warning strong {
          color: #000000;
        }
        .divider {
          height: 1px;
          background: #dddddd;
          margin: 25px 0;
        }
        .info-text {
          color: #666666;
          font-size: 14px;
          margin: 10px 0;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ EMAIL VERIFICATION</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName}!</div>
          <p>Thank you for joining our community! To complete your registration, please verify your email address using the OTP code below:</p>
          
          <div class="otp-code">
            <p><strong>YOUR VERIFICATION CODE</strong></p>
            <div class="otp-number">${otp}</div>
            <p class="info-text">This code will expire in 10 minutes</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="warning">
            <strong>⚠️ SECURITY NOTICE:</strong> Do not share this code with anyone. Our team will never ask for your verification code.
          </div>
          
          <p class="info-text">If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p><strong>Community Platform</strong></p>
          <p class="info-text">This is an automated email. Please do not reply to this message.</p>
          <p class="info-text">If you need assistance, contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email, isUsed: false });

    // Save new OTP
    const otpRecord = new OTP({
      email,
      otp,
      expiresAt
    });

    await otpRecord.save();

    // Send email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification - Community Registration',
      html: generateOTPEmailTemplate(otp, name)
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { 
        message: 'OTP sent successfully',
        expiresIn: 10 * 60 // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
