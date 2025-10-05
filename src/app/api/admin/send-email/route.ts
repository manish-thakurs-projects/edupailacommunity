import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Email from '@/models/Email';
import nodemailer from 'nodemailer';

// Middleware to verify admin token
function verifyAdminToken(request: NextRequest, fallbackToken?: string) {
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = headerToken || fallbackToken;
  
  if (!token) {
    return null;
  }

  // Allow the demo token used by the client-side admin panel for local/dev
  if (token === 'demo-token') {
    return { username: process.env.ADMIN_USERNAME };
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    return decoded;
  } catch (error) {
    console.error('verifyAdminToken: jwt.verify failed', (error as Error).message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('[admin/send-email] route invoked');
  try {
    // Parse body once
    const body = await request.json();
    console.log('[admin/send-email] request.body:', JSON.stringify(body?.subject ? { subject: body.subject, hasContent: !!body.content } : body));
    const { subject, content, attachments, videoLinks, recipientEmails, adminToken } = body;

    // Verify admin authentication (header OR adminToken in body OR demo-token)
    const headerAuth = request.headers.get('authorization');
    console.log('[admin/send-email] authorization header:', headerAuth ? 'present' : 'missing');
    const admin = verifyAdminToken(request, adminToken);
    console.log('[admin/send-email] admin verification result:', admin ? { user: (admin as any).username || (admin as any).adminId } : null);
    if (!admin) {
      console.error('[admin/send-email] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    if (!subject || !content) {
      console.error('[admin/send-email] Missing subject or content');
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    // Get all user emails if no specific recipients
    let recipients: string[] = Array.isArray(recipientEmails) ? recipientEmails.slice() : [];
    if (!Array.isArray(recipients)) recipients = [];
    if (recipients.length === 0) {
      const users = await User.find({}, 'email');
      recipients = users.map((user: any) => String(user.email).toLowerCase());
      console.log(`[admin/send-email] Loaded ${recipients.length} recipients from DB`);
    } else {
      console.log(`[admin/send-email] Using ${recipients.length} recipients from request`);
    }

    // Build a name map for personalization (email -> name)
    const usersFound = await User.find({ email: { $in: recipients } }, 'email name').lean();
    const nameMap = new Map<string, string>();
    usersFound.forEach((u: any) => {
      if (u && u.email) nameMap.set(String(u.email).toLowerCase(), (u.name || '').trim());
    });

    if (recipients.length === 0) {
      console.warn('[admin/send-email] No recipients found — aborting');
      return NextResponse.json({ error: 'No recipients to send to' }, { status: 400 });
    }
    
    // Create email record
    // Save only filenames (or URLs) in DB to match Email model validation (often expects [String]).
    const attachmentNames = (attachments || []).map((a: any) => {
      if (!a) return '';
      return a.name || a.filename || (typeof a === 'string' ? a : '');
    }).filter(Boolean);

    const emailRecord = new Email({
      subject,
      content,
      attachments: attachmentNames,
      videoLinks: videoLinks || [],
      recipients,
      sentBy: (admin && ((admin as any).username || (admin as any).adminId)) || process.env.ADMIN_USERNAME
    });
    console.log('[admin/send-email] attachments saved to DB:', attachmentNames);
    
    await emailRecord.save();
    console.log('[admin/send-email] Email record saved:', emailRecord._id);

    // Validate SMTP config
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('[admin/send-email] SMTP configuration missing', { smtpHost, smtpUserPresent: !!smtpUser });
      return NextResponse.json({ error: 'SMTP configuration is missing on server' }, { status: 500 });
    }

    // Send emails
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transporter.verify();
      console.log('[admin/send-email] SMTP transporter verified');
    } catch (err) {
      console.error('[admin/send-email] transporter.verify() failed:', (err as Error).message);
      return NextResponse.json({ error: 'SMTP connection/credentials invalid' }, { status: 500 });
    }

    // Prepare attachments safely: convert base64 content to Buffer if needed
    const normalizeAttachments = (attachments || []).map((file: any) => {
      if (!file) return null;
      const name = file.name || file.filename || 'attachment';
      const content = file.content ?? file.data ?? null;
      // If content is a data URL like "data:...;base64,AAA..." strip prefix
      let normalizedContent: any = content;
      if (typeof content === 'string') {
        const dataUrlMatch = content.match(/^data:.*;base64,(.*)$/);
        if (dataUrlMatch) {
          normalizedContent = Buffer.from(dataUrlMatch[1], 'base64');
        } else {
          // If plain base64 string, keep and set encoding below
          normalizedContent = content;
        }
      }
      return {
        filename: name,
        content: normalizedContent,
        encoding: typeof normalizedContent === 'string' ? 'base64' : undefined
      };
    }).filter(Boolean) as any[];

    console.log('[admin/send-email] Prepared attachments count:', normalizeAttachments.length);

    const results: { to: string; success: boolean; info?: any; error?: any }[] = [];

    // Send sequentially to capture per-mail errors (safer for debugging)
    for (const to of recipients) {
      try {
        if (!to || typeof to !== 'string' || !to.includes('@')) {
          console.warn('[admin/send-email] Skipping invalid recipient:', to);
          results.push({ to, success: false, error: 'invalid recipient' });
          continue;
        }

        // pick name from DB map or fallback to local-part of email
        const recipientEmailKey = String(to).toLowerCase();
        const recipientName = nameMap.get(recipientEmailKey) || recipientEmailKey.split('@')[0];

        const mailOptions: any = {
          from: smtpUser,
          to,
          subject,
          html: generateEmailTemplate(content, videoLinks || [], attachments || [], recipientName),
        };

        if (normalizeAttachments.length > 0) {
          mailOptions.attachments = normalizeAttachments;
        }

        console.log(`[admin/send-email] Sending to: ${to} (name: ${recipientName})`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[admin/send-email] Sent to ${to}: messageId=${info.messageId || info.response}`);
        results.push({ to, success: true, info });
      } catch (sendErr) {
        console.error(`[admin/send-email] Error sending to ${to}:`, (sendErr as Error).message);
        results.push({ to, success: false, error: (sendErr as Error).message });
      }
    }

    const failed = results.filter(r => !r.success);
    console.log(`[admin/send-email] send results: ${results.length} processed, ${failed.length} failed`);

    return NextResponse.json(
      { message: 'Emails processed', emailId: emailRecord._id, results },
      { status: failed.length === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error('Send email error:', (error as Error).message, error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}function generateEmailTemplate(content: string, videoLinks: string[], attachments: any[] = [], recipientName = 'there') {
  // HTML escape function for security
  const escapeHtml = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeName = escapeHtml(recipientName);
  const safeContent = escapeHtml(content).replace(/\n/g, '</p><p>');

  // Attachments display
  const attachmentDisplay = (attachments || []).map((a: any, i: number) => {
    if (!a) return { name: `Attachment ${i + 1}`, type: '', size: null };
    if (typeof a === 'string') return { name: a, type: '', size: null };
    return {
      name: a.name || a.filename || `Attachment ${i + 1}`,
      type: a.type || (a.mime || ''),
      size: typeof a.size === 'number' ? a.size : null,
    };
  });

  const renderAttachmentItem = (att: any, idx: number) => {
    const name = escapeHtml(att.name || `Attachment ${idx + 1}`);
    const meta = [];
    if (att.type) meta.push(escapeHtml(att.type));
    if (att.size != null) meta.push(`${Math.round(att.size / 1024)} KB`);
    const metaStr = meta.length ? `<div style="font-size:12px;color:#888;margin-top:2px">${meta.join(' • ')}</div>` : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:8px;background:#fff;border:1px solid #222;margin-bottom:6px;">
        <div style="font-size:20px;color:#000;">📎</div>
        <div>
          <div style="font-weight:600;color:#000;font-size:15px">${name}</div>
          ${metaStr}
        </div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edupaila Premium Update</title>
  <style>
    body {
      background: #fff;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 80%;
      margin: 40px auto;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      border: 1px solid #222;
      overflow: hidden;
    }
    .header {
      background: #000;
      color: #fff;
      padding: 38px 32px 24px 32px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      margin-bottom: 8px;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    }
    .tagline {
      font-size: 16px;
      font-weight: 500;
      opacity: 0.85;
      margin-bottom: 6px;
      color: #fff;
    }
    .header-divider {
      margin: 18px auto 0 auto;
      width: 60px;
      height: 3px;
      border-radius: 2px;
      background: #fff;
      opacity: 0.18;
    }
    .main {
      padding: 38px 32px 32px 32px;
      background: #fff;
    }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #000;
      letter-spacing: 0.2px;
    }
    .update-title {
      font-size: 18px;
      margin-bottom: 18px;
      color: #000;
    }
    .content-body {
      font-size: 16px;
      line-height: 1.7;
      color: #222;
      margin-bottom: 28px;
    }
    .media-section {
      margin: 32px 0 0 0;
      padding: 24px 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      margin-bottom: 12px;
    }
    .video-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
    }
    .video-link {
      display: inline-block;
      padding: 12px 22px;
      background: #000;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: background 0.2s;
      border: none;
    }
    .video-link:hover {
      background: #222;
    }
    .attachments-grid {
      margin-top: 10px;
    }
    .footer {
      background: #fff;
      padding: 32px 24px;
      text-align: center;
      border-top: 1px solid #222;
    }
    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: #000;
      margin-bottom: 10px;
    }
    .footer-text {
      font-size: 14px;
      color: #888;
      margin-bottom: 18px;
      line-height: 1.6;
    }
    .footer-bottom {
      font-size: 12px;
      color: #aaa;
      margin-top: 12px;
    }
    @media (max-width: 650px) {
      .container, .main, .header, .footer { padding-left: 10px; padding-right: 10px; }
      .main { padding-top: 24px; padding-bottom: 24px; }
      .header { padding-top: 24px; padding-bottom: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EDUPAILA</div>
      <div class="tagline">Premium Educational Community Platform</div>
      <div class="header-divider"></div>
    </div>
    <div class="main">
      <div class="greeting">Hello ${safeName},</div>
      <div class="update-title">Here's an important update from our team:</div>
      <div class="content-body">
        <p>${safeContent}</p>
      </div>
      ${videoLinks && videoLinks.length > 0 ? `
        <div class="media-section">
          <div class="section-title">🎬 Video Resources</div>
          <div style="font-size:14px;color:#888;margin-bottom:10px;">Access the following video content:</div>
          <div class="video-grid">
            ${videoLinks.map((link: string, index: number) => `
              <a href="${escapeHtml(link)}" class="video-link" target="_blank" rel="noopener noreferrer">
                ${videoLinks.length > 1 ? `Watch Video ${index + 1}` : 'Watch Video'}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
  
    </div>
    <div class="footer">
      <div class="footer-logo">EDUPAILA</div>
      <div class="footer-text">
        This message was sent from our premium educational community platform.<br>
        Please do not reply to this automated message.
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} Edupaila Community. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}