import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import OTP from '@/models/OTP';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  console.log('[admin/auth/request-otp] invoked');
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      console.warn('[admin/auth/request-otp] invalid email:', email);
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await connectDB();

    // Search by email OR by username (some admin docs store email in username)
    let admin = await Admin.findOne({ $or: [{ email }, { username: email }] });
    if (!admin) {
      console.warn('[admin/auth/request-otp] admin not found for email:', email);

      const allowSelf = String(process.env.ALLOW_ADMIN_SELF_REGISTER || '').toLowerCase() === 'true';
      if (allowSelf) {
        try {
          console.log('[admin/auth/request-otp] ALLOW_ADMIN_SELF_REGISTER=true — creating admin:', email);
          admin = await Admin.create({ email, username: email, name: 'Admin', role: 'admin' } as any);
          console.log('[admin/auth/request-otp] Admin created id=', admin._id);
        } catch (createErr) {
          console.error('[admin/auth/request-otp] failed to create admin:', (createErr as Error).message, createErr);
          return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
        }
      } else {
        console.error('[admin/auth/request-otp] Admin not found and self-register disabled. Create an Admin in DB or enable ALLOW_ADMIN_SELF_REGISTER for dev.');
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }
    } else {
      // If admin exists but email field missing, attempt to set it for future lookups
      if (!admin.email && admin.username && admin.username.includes('@')) {
        try {
          admin.email = admin.username;
          await admin.save();
          console.log('[admin/auth/request-otp] Updated admin doc to include email field for', admin.username);
        } catch (updErr) {
          console.warn('[admin/auth/request-otp] could not update admin email field:', (updErr as Error).message);
        }
      }
    }

    // remove old OTPs for this email/purpose
    await OTP.deleteMany({ email, purpose: 'admin-login' }).catch(() => {});

    // generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    // IMPORTANT: OTP model expects field `otp` (not `code`) — save accordingly
    const otpRecord = new OTP({ email, otp: code, purpose: 'admin-login', expiresAt });
    await otpRecord.save();
    console.log('[admin/auth/request-otp] OTP saved id=', otpRecord._id, 'otp=', code);

    // SMTP config
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('[admin/auth/request-otp] SMTP not configured');
      return NextResponse.json({ error: 'SMTP not configured on server' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.verify();
      console.log('[admin/auth/request-otp] SMTP verified');
    } catch (err) {
      console.error('[admin/auth/request-otp] SMTP verify failed:', (err as Error).message);
      return NextResponse.json({ error: 'SMTP connection failed' }, { status: 500 });
    }

    const mailOptions = {
      from: smtpUser,
      to: email,
      subject: 'Your admin login code',
      text: `Your admin login code is: ${code}\nIt expires in 10 minutes.`,
      html: `<p>Your admin login code is: <strong>${code}</strong></p><p>Expires in 10 minutes.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[admin/auth/request-otp] OTP email sent:', info.messageId || info.response);

    return NextResponse.json({ message: 'OTP sent' }, { status: 200 });
  } catch (err) {
    console.error('[admin/auth/request-otp] error:', (err as Error).message, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}