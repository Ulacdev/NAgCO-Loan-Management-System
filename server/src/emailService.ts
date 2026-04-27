import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Gmail SMTP transporter — works in localhost AND hosting (Render, Railway, etc.)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send approval email to member
export async function sendApprovalEmail(toEmail: string, memberName: string) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '✅ Account Approved — NAgCO Loan Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8faf8; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
            <p style="color: #666; font-size: 12px; margin-top: 4px;">Napilihan Agriculture Cooperative</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Welcome, ${memberName}!</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Your account has been <strong style="color: #15803d;">approved</strong> by the administrator. You can now log in to the system and access all member features.
            </p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
              You can now:
            </p>
            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>View your dashboard</li>
              <li>Submit loan requests</li>
              <li>Track your payments</li>
            </ul>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Napilihan Agriculture Cooperative System
          </p>
        </div>
      `,
    });
    console.log(`✅ Approval email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

// Send rejection email to member
export async function sendRejectionEmail(toEmail: string, memberName: string) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '❌ Account Rejected — NAgCO Loan Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #fef2f2; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
            <p style="color: #666; font-size: 12px; margin-top: 4px;">Napilihan Agriculture Cooperative</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Hi ${memberName},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
              Unfortunately, your account registration has been <strong style="color: #dc2626;">rejected</strong>. Please contact the cooperative office for more details.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Napilihan Agriculture Cooperative System
          </p>
        </div>
      `,
    });
    console.log(`✅ Rejection email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return false;
  }
}

// Send registration notification to admin
export async function sendNewRegistrationEmail(memberName: string, memberEmail: string) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER!, // send to admin email
      subject: `🆕 New Registration — ${memberName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #eff6ff; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">New Account Pending Approval</h2>
            <p style="color: #4b5563; font-size: 14px;"><strong>Name:</strong> ${memberName}</p>
            <p style="color: #4b5563; font-size: 14px;"><strong>Email:</strong> ${memberEmail}</p>
            <p style="color: #4b5563; font-size: 14px; margin-top: 16px;">
              Please log in to the admin dashboard to approve or reject this registration.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Admin notification sent for new registration: ${memberEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Admin notification email failed:', error);
    return false;
  }
}

// Send password reset link email
export async function sendResetLinkEmail(toEmail: string, memberName: string, resetToken: string, frontendUrl?: string) {
  const baseUrl = process.env.APP_URL || frontendUrl || 'http://localhost:3000';
  const resetLink = `${baseUrl}/?view=reset&token=${resetToken}`;
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '🔐 Reset Your Password — NAgCO Loan Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f3f4f6; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Hi ${memberName},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${resetLink}" style="background: #15803d; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser: <br/>
              <span style="color: #15803d;">${resetLink}</span>
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`✅ Reset link sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Reset link email failed:', error);
    return false;
  }
}

// Send Announcement Email to all users
export async function sendAnnouncementEmail(toEmail: string, title: string, content: string) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `📢 NEW NOTICE: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fffbeb; border-radius: 12px; border: 1px solid #fef3c7;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
            <p style="color: #666; font-size: 12px; margin-top: 4px;">Important Cooperative Announcement</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #fde68a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 16px; border-bottom: 2px solid #fef3c7; pb-8">${title}</h2>
            <div style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0; white-space: pre-wrap;">
              ${content}
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="background: #15803d; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 12px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                View on Dashboard
              </a>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Napilihan Agriculture Cooperative System
          </p>
        </div>
      `,
    });
    console.log(`✅ Announcement email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Announcement email failed:', error);
    return false;
  }
}

// Send OTP Email
export async function sendOTPEmail(toEmail: string, memberName: string, otp: string) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '🔐 Your Login OTP — NAgCO Loan Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f0fdf4; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 8px; border: 1px solid #dcfce7; text-align: center;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Hi ${memberName},</h2>
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 24px;">
              Please use the following 6-digit code to verify your login. This code will expire in 10 minutes.
            </p>
            <div style="background: #f0fdf4; color: #15803d; font-size: 32px; font-weight: 900; letter-spacing: 8px; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0; display: inline-block;">
              ${otp}
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            If you didn't attempt to log in, please secure your account immediately.
          </p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ OTP email failed:', error);
    return false;
  }
}
// Send Loan Request Notification to Admin
export async function sendLoanRequestEmail(memberName: string, loanType: string, amount: number) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER!,
      subject: `💰 New Loan Request — ${memberName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #eff6ff; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">New Loan Application</h2>
            <p style="color: #4b5563; font-size: 14px;"><strong>Member:</strong> ${memberName}</p>
            <p style="color: #4b5563; font-size: 14px;"><strong>Loan Type:</strong> ${loanType}</p>
            <p style="color: #4b5563; font-size: 14px;"><strong>Amount:</strong> ₱ ${amount.toLocaleString()}</p>
            <p style="color: #4b5563; font-size: 14px; margin-top: 16px;">
              Please log in to the admin dashboard to review this request.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Admin loan notification sent for ${memberName}`);
    return true;
  } catch (error) {
    console.error('❌ Admin loan notification failed:', error);
    return false;
  }
}

// Send Loan Status Update to Member
export async function sendLoanStatusUpdateEmail(toEmail: string, memberName: string, loanType: string, amount: number, status: string) {
  const isApproved = status === 'Active';
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${isApproved ? '✅' : '❌'} Loan Request ${isApproved ? 'Approved' : 'Rejected'} — NAgCO`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Hi ${memberName},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Your request for a <strong>${loanType}</strong> in the amount of <strong>₱ ${amount.toLocaleString()}</strong> has been <strong style="color: ${isApproved ? '#15803d' : '#dc2626'};">${isApproved ? 'APPROVED' : 'REJECTED'}</strong>.
            </p>
            ${isApproved ? `
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
              The funds will be released according to the cooperative's schedule. Please check your dashboard for payment terms and release details.
            </p>` : `
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
              Please contact the cooperative office if you have any questions regarding this decision.
            </p>`}
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Napilihan Agriculture Cooperative System
          </p>
        </div>
      `,
    });
    console.log(`✅ Loan status email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Loan status email failed:', error);
    return false;
  }
}

// Send Loan Request Confirmation to Member
export async function sendLoanRequestConfirmationEmail(toEmail: string, memberName: string, loanType: string, amount: number) {
  try {
    await transporter.sendMail({
      from: `"NAgCO System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '📝 Loan Request Received — NAgCO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #15803d; font-size: 20px; margin: 0;">NAgCO Loan Management System</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Hi ${memberName},</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Thank you for requesting a loan from NAgCO. We have successfully received your application for a <strong>${loanType}</strong> in the amount of <strong>₱ ${amount.toLocaleString()}</strong>.
            </p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Your request is now <strong>Pending</strong> and is being reviewed by our administrators. We will notify you via email as soon as a decision has been made.
            </p>
            <p style="color: #15803d; font-size: 14px; font-weight: bold; margin: 0;">
              Thank you for your trust in our cooperative!
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Napilihan Agriculture Cooperative System
          </p>
        </div>
      `,
    });
    console.log(`✅ Loan request confirmation sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Loan request confirmation failed:', error);
    return false;
  }
}
