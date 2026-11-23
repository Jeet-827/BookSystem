import nodemailer from 'nodemailer';
import logger from './logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    logger.warn('[EmailService] SMTP credentials not fully configured in env (SMTP_USER/SMTP_PASS). Email sending will fallback or log.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
};

/**
 * Sends password reset email with verification code
 * @param {string} toEmail
 * @param {string} resetCode
 * @param {string} recipientName
 */
export const sendPasswordResetEmail = async (toEmail, resetCode, recipientName = 'User') => {
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@redkitindia.com';
  const mailOptions = {
    from: `"redkitindia Security" <${fromAddress}>`,
    to: toEmail,
    subject: `${resetCode} is your redkitindia password reset code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo-badge { display: inline-block; background: #0f1115; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
          h2 { margin: 16px 0 8px; font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 8px 0; }
          .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 0; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-badge">redkitindia</div>
            <h2>Password Reset Code</h2>
            <p>Hello ${recipientName}, we received a request to reset your redkitindia account password.</p>
          </div>
          <div class="code-box">
            <div class="code">${resetCode}</div>
            <div class="expiry">Valid for 15 minutes. Do not share this code with anyone.</div>
          </div>
          <p>Enter this 6-digit code on the reset password screen to choose your new password.</p>
          <p>If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized access.</p>
          <div class="footer">
            &copy; 2026 redkitindia • Instant Digital eBook Platform<br/>
            This is an automated security notification.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your redkitindia password reset code is: ${resetCode}\n\nValid for 15 minutes.\nIf you did not request this, please ignore this email.`,
  };

  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail(mailOptions);
    logger.info(`[EmailService] Password reset code sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[EmailService] Failed to send email to ${toEmail}: ${err.message}`);
    return { success: false, error: err.message };
  }
};
