import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'rf-electro-erp-2fa-secret-key-2026';
const TARGET_OTP_EMAIL = 'milanpandavadra84@gmail.com';
const SENDER_EMAIL = 'milanpandavadra84@gmail.com';
const SENDER_PASS = 'quldwsmtakixaqmv';

export async function POST(req: NextRequest) {
  try {
    const { tempToken } = await req.json();

    if (!tempToken) {
      return NextResponse.json({ message: 'Security token is required' }, { status: 400 });
    }

    const decoded = Buffer.from(tempToken, 'base64url').toString('utf8');
    const [payloadStr, signature] = decoded.split('::');

    if (!payloadStr || !signature) {
      return NextResponse.json({ message: 'Invalid verification session.' }, { status: 400 });
    }

    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSig) {
      return NextResponse.json({ message: 'Invalid session signature.' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    // Generate fresh OTP
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const freshExpiresAt = Date.now() + 10 * 60 * 1000;

    const freshPayloadStr = JSON.stringify({
      email: payload.email,
      password: payload.password,
      otp: freshOtp,
      expiresAt: freshExpiresAt,
    });
    const freshSignature = crypto.createHmac('sha256', HMAC_SECRET).update(freshPayloadStr).digest('hex');
    const freshToken = Buffer.from(`${freshPayloadStr}::${freshSignature}`).toString('base64url');

    // Send email via Gmail SMTP
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
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Resent Security Verification Code</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">A new login code was requested for: <strong>${payload.email}</strong></p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; padding: 14px 24px; background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 8px; display: inline-block; font-family: monospace;">
            ${freshOtp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 14px;">Enter this 6-digit code. Valid for <strong>10 minutes</strong>.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"RF Electro ERP" <${SENDER_EMAIL}>`,
      to: TARGET_OTP_EMAIL,
      subject: `RF Electro ERP - Fresh Login OTP: ${freshOtp}`,
      text: `Your new login OTP code is: ${freshOtp}. Valid for 10 minutes.`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      tempToken: freshToken,
      message: `Fresh OTP code sent to ${TARGET_OTP_EMAIL}`,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ message: 'Failed to resend OTP. Please try again.' }, { status: 500 });
  }
}
