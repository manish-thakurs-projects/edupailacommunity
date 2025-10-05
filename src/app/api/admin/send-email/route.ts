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

    if (recipients.length === 0) {
      console.warn('[admin/send-email] No recipients found — aborting');
      return NextResponse.json({ error: 'No recipients to send to' }, { status: 400 });
    }

    // Create email record
    const emailRecord = new Email({
      subject,
      content,
      attachments: attachments || [],
      videoLinks: videoLinks || [],
      recipients,
      sentBy: (admin && ((admin as any).username || (admin as any).adminId)) || process.env.ADMIN_USERNAME
    });

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

        const mailOptions: any = {
          from: smtpUser,
          to,
          subject,
          html: generateEmailTemplate(content, videoLinks || [], attachments || []),
        };

        if (normalizeAttachments.length > 0) {
          mailOptions.attachments = normalizeAttachments;
        }

        console.log(`[admin/send-email] Sending to: ${to}`);
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
}

function generateEmailTemplate(content: string, videoLinks: string[], attachments: string[]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #000000;
          background-color: #ffffff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }
        
        .email-header {
          border-bottom: 2px solid #000000;
          padding: 32px 40px 24px;
          text-align: left;
        }
        
        .email-logo {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #000000;
          text-decoration: none;
        }
        
        .email-content {
          padding: 40px;
        }
        
        .email-body {
          font-size: 16px;
          line-height: 1.7;
          color: #000000;
          margin-bottom: 32px;
        }
        
        .email-body p {
          margin-bottom: 20px;
        }
        
        .media-section {
          margin: 32px 0;
          padding: 0;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          color: #000000;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 8px;
        }
        
        .video-grid {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }
        
        .video-link {
          display: block;
          padding: 16px;
          border: 1px solid #e5e5e5;
          text-decoration: none;
          color: #000000;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }
        
        .video-link:hover {
          border-color: #000000;
          background-color: #f8f8f8;
        }
        
        .video-link::before {
          content: "▶";
          margin-right: 12px;
          font-size: 12px;
          color: #000000;
        }
        
        .attachments-grid {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }
        
        .attachment-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e5e5;
          font-size: 14px;
          color: #000000;
        }
        
        .attachment-item::before {
          content: "📎";
          margin-right: 12px;
          font-size: 14px;
        }
        
        .email-footer {
          border-top: 1px solid #e5e5e5;
          padding: 24px 40px;
          text-align: center;
        }
        
        .footer-text {
          font-size: 12px;
          color: #666666;
          line-height: 1.5;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
          .email-header {
            padding: 24px 20px 16px;
          }
          
          .email-content {
            padding: 24px 20px;
          }
          
          .email-body {
            font-size: 15px;
          }
          
          .email-footer {
            padding: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .email-header {
            padding: 20px 16px 12px;
          }
          
          .email-content {
            padding: 20px 16px;
          }
          
          .video-link,
          .attachment-item {
            padding: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <header class="email-header">
          <div class="email-logo">COMMUNITY</div>
        </header>
        
        <main class="email-content">
          <div class="email-body">
            ${content.replace(/\n/g, '</p><p>')}
          </div>
          
          ${videoLinks && videoLinks.length > 0 ? `
            <div class="media-section">
              <div class="section-title">Video Content</div>
              <div class="video-grid">
                ${videoLinks.map(link => `
                  <a href="${link}" class="video-link" target="_blank">Watch Video Presentation</a>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${attachments && attachments.length > 0 ? `
            <div class="media-section">
              <div class="section-title">Attached Files</div>
              <div class="attachments-grid">
                ${attachments.map((file: any) => `
                  <div class="attachment-item">${file.name}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </main>
        
        <footer class="email-footer">
          <div class="footer-text">
            This email was sent from our community platform.<br>
            Please do not reply to this automated message.
          </div>
        </footer>
      </div>
    </body>
    </html>
  `;
}