import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import OTP from '@/models/OTP';

export async function POST(request: NextRequest) {
  console.log('[admin/auth/verify-otp] invoked');
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const codeRaw = body?.code ?? body?.otp ?? '';
    const codeStr = String(codeRaw).trim();
    const codeDigits = codeStr.replace(/\D/g, ''); // tolerate spaces/newlines

    console.log('[admin/auth/verify-otp] incoming email:', email, 'codeRaw:', codeRaw);

    if (!email || !codeStr) {
      console.warn('[admin/auth/verify-otp] missing email or code');
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    await connectDB();

    // Fetch recent OTPs for this email so we can debug what's stored
    const recentOtps = await OTP.find({ email }).sort({ createdAt: -1 }).limit(10).lean();
    console.log(`[admin/auth/verify-otp] recent OTPs count=${recentOtps.length}`);
    recentOtps.forEach((o: any, i: number) => {
      // show value for debugging in dev; mask in production if needed
      console.log(`[admin/auth/verify-otp] otp[${i}] id=${o._id} otp=${o.otp ?? o.code} purpose=${o.purpose} expiresAt=${o.expiresAt}`);
    });

    // Try tolerant match: check both 'otp' and 'code' fields, string/number forms
    let otpDoc: any = null;
    for (const o of recentOtps) {
      const candidate = String(o.otp ?? o.code ?? '').trim().replace(/\D/g, '');
      if (!candidate) continue;
      if (candidate === codeDigits) {
        otpDoc = o;
        break;
      }
    }

    // fallback: direct query (in case model uses different naming)
    if (!otpDoc) {
      const byOtp = await OTP.findOne({ email, otp: codeStr });
      if (byOtp) otpDoc = byOtp;
    }
    if (!otpDoc) {
      const byCode = await OTP.findOne({ email, code: codeStr });
      if (byCode) otpDoc = byCode;
    }

    if (!otpDoc) {
      console.warn('[admin/auth/verify-otp] otp not found for', email);
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Check expiry
    if (otpDoc.expiresAt && new Date(otpDoc.expiresAt) < new Date()) {
      console.warn('[admin/auth/verify-otp] otp expired for', email, 'otpId=', otpDoc._id);
      await OTP.deleteOne({ _id: otpDoc._id }).catch(() => {});
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // Find admin by email or username
    const admin = await Admin.findOne({ $or: [{ email }, { username: email }] });
    if (!admin) {
      console.warn('[admin/auth/verify-otp] admin not found for', email);
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[admin/auth/verify-otp] NEXTAUTH_SECRET not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const payload = { adminId: admin._id.toString(), email: admin.email || admin.username };
    const token = jwt.sign(payload, secret, { expiresIn: '4h' });
    console.log('[admin/auth/verify-otp] token created for adminId=', admin._id.toString());

    // delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id }).catch(() => {});

    return NextResponse.json({ message: 'Verified', token }, { status: 200 });
  } catch (err) {
    console.error('[admin/auth/verify-otp] error:', (err as Error).message, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}