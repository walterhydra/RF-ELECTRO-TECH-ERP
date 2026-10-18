import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'rf-electro-erp-2fa-secret-key-2026';

export async function POST(req: NextRequest) {
  try {
    const { tempToken, otp } = await req.json();

    if (!tempToken || !otp) {
      return NextResponse.json({ message: 'Security token and OTP code are required' }, { status: 400 });
    }

    // Decode and verify HMAC signature
    const decoded = Buffer.from(tempToken, 'base64url').toString('utf8');
    const [payloadStr, signature] = decoded.split('::');

    if (!payloadStr || !signature) {
      return NextResponse.json({ message: 'Invalid or malformed verification token.' }, { status: 400 });
    }

    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSig) {
      return NextResponse.json({ message: 'Invalid security signature. Please request a new OTP.' }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    if (Date.now() > payload.expiresAt) {
      return NextResponse.json({ message: 'OTP code has expired. Please request a fresh code.' }, { status: 400 });
    }

    if (payload.otp !== otp.trim()) {
      return NextResponse.json({ message: 'Incorrect OTP code. Please enter the code sent to milanpandavadra84@gmail.com' }, { status: 400 });
    }

    // OTP verified! Login to live production backend to obtain fresh JWT tokens
    const loginRes = await fetch('https://api.rfgenix.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData.accessToken) {
      return NextResponse.json({ message: 'Could not finalize session. Please log in again.' }, { status: 500 });
    }

    const response = NextResponse.json({
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      user: loginData.user,
      message: 'Login successful',
    });

    // Set 90-day persistent cookies on response
    response.cookies.set('rf_session_token', loginData.accessToken, {
      path: '/',
      maxAge: 7776000, // 90 days
      sameSite: 'lax',
      secure: true,
    });

    const roleName = loginData.user?.role?.name || loginData.user?.role || 'Super Admin';
    response.cookies.set('rf_user_role', encodeURIComponent(roleName), {
      path: '/',
      maxAge: 7776000,
      sameSite: 'lax',
      secure: true,
    });

    return response;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
