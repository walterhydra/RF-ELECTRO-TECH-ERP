import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'rf-electro-erp-2fa-secret-key-2026';
const TARGET_OTP_EMAIL = 'milanpandavadra84@gmail.com';
const SENDER_EMAIL = 'milanpandavadra84@gmail.com';
const SENDER_PASS = 'quldwsmtakixaqmv';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // 1. Verify credentials against the live production backend
    const authRes = await fetch('https://api.rfgenix.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.accessToken) {
      return NextResponse.json(
        { message: authData.message || authData.error?.message || 'Invalid username or password. Please try again.' },
        { status: 401 }
      );
    }

    // 2. Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 3. Create stateless signed tempToken
    const tokenPayload = JSON.stringify({
      email: email.trim(),
      password,
      otp,
      expiresAt,
    });
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(tokenPayload).digest('hex');
    const tempToken = Buffer.from(`${tokenPayload}::${signature}`).toString('base64url');

    // 4. Send Email via Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: bold;">RF ELECTRO TECH ERP</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Security Login Verification Code</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">A login request was initiated for: <strong>${email}</strong> (${authData.user?.name || 'Authorized User'})</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; padding: 14px 24px; background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 8px; display: inline-block; font-family: monospace;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 14px;">Enter this 6-digit verification code to complete sign-in. Code expires in <strong>10 minutes</strong>.</p>
        </div>
        <div style="color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          <p style="margin: 0;">Automated security notification from RF Electro Tech ERP. If you did not request this, please review active sessions.</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"RF Electro ERP" <${SENDER_EMAIL}>`,
        to: TARGET_OTP_EMAIL,
        subject: `RF Electro ERP - Login OTP Verification Code: ${otp}`,
        text: `Your RF Electro ERP login OTP code is: ${otp}. Valid for 10 minutes.`,
        html: htmlContent,
      });
      console.log(`✅ [2FA OTP SENT] Email delivered to ${TARGET_OTP_EMAIL} with code ${otp}`);
    } catch (mailErr: any) {
      console.error('SMTP Send Error:', mailErr.message);
    }

    return NextResponse.json({
      otpRequired: true,
      tempToken,
      targetEmail: TARGET_OTP_EMAIL,
      maskedEmail: TARGET_OTP_EMAIL,
      userEmail: email,
      message: `Security OTP code has been dispatched to ${TARGET_OTP_EMAIL}`,
    });
  } catch (error: any) {
    console.error('Request OTP handler error:', error);
    return NextResponse.json(
      { message: 'Authentication server error. Please try again.' },
      { status: 500 }
    );
  }
}
