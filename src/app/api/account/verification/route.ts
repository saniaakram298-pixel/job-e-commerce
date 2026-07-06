import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { EmailVerification } from '@/models/EmailVerification';
import { sendOrderConfirmationEmail } from '@/lib/email';

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await EmailVerification.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { email: email.toLowerCase().trim(), code, expiresAt },
      { upsert: true, new: true }
    );

    await sendOrderConfirmationEmail({
      to: email,
      subject: 'Your Atelier verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<div><p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p></div>`,
    });

    return NextResponse.json({ success: true, message: 'Verification code sent' });
  } catch (error: any) {
    console.error('[api/account/verification] POST error:', error.message || error);
    return NextResponse.json({ success: false, message: 'Unable to send verification code' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;
    if (!email || !code || typeof code !== 'string' || code.trim().length !== 4) {
      return NextResponse.json({ success: false, message: 'Email and 4-digit code are required' }, { status: 400 });
    }

    await connectDB();

    const verification = await EmailVerification.findOne({
      email: email.toLowerCase().trim(),
      code: code.trim(),
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return NextResponse.json({ success: false, message: 'Invalid or expired verification code' }, { status: 400 });
    }

    await EmailVerification.deleteOne({ _id: verification._id });

    return NextResponse.json({ success: true, message: 'Email verified' });
  } catch (error: any) {
    console.error('[api/account/verification] PATCH error:', error.message || error);
    return NextResponse.json({ success: false, message: 'Unable to verify code' }, { status: 500 });
  }
}
