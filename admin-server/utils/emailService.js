import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
};

export const sendAdminPasswordResetEmail = async (toEmail, resetCode, recipientName = 'Administrator') => {
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@redkitindia.com';
  const mailOptions = {
    from: `"redkitindia Admin Portal" <${fromAddress}>`,
    to: toEmail,
    subject: `[ADMIN CODE] ${resetCode} - redkitindia Password Reset`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f1115; margin: 0; padding: 24px; color: #f8fafc; }
          .container { max-width: 480px; margin: 0 auto; background: #13161c; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo-badge { display: inline-block; background: #f59e0b; color: #000000; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-size: 16px; }
          h2 { margin: 16px 0 8px; font-size: 20px; font-weight: 800; color: #ffffff; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
          .code-box { background: #000000; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; margin: 0; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-badge">ADMIN SECURITY</div>
          <h2>Administrator Password Reset</h2>
          <p>Hello ${recipientName}, you requested to reset your administrator credentials for redkitindia.</p>
          <div class="code-box">
            <div class="code">${resetCode}</div>
            <div class="expiry">Valid for 15 minutes.</div>
          </div>
          <p>Enter this verification code into the Admin Portal to complete your password update.</p>
        </div>
      </body>
      </html>
    `,
    text: `Your redkitindia admin reset code is: ${resetCode}\n\nValid for 15 minutes.`,
  };

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[AdminEmailService] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};
