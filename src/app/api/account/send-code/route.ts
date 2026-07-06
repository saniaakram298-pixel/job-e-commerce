import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { sendEmail } from '@/lib/email';
import { VerificationCode } from '@/models/VerificationCode';

export const dynamic = 'force-dynamic';

function generateFourDigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return createErrorResponse('A valid email is required.', 400);
    }

    await connectDB();

    const code = generateFourDigitCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await VerificationCode.create({ email, code, expiresAt, used: false });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 0.5rem;">Your verification code</h2>
        <p style="margin-top: 0;">Use this 4-digit code to access your account:</p>
        <p style="font-size: 2rem; font-weight: 700; margin: 1rem 0; letter-spacing: 0.25rem;">${code}</p>
        <p style="margin: 0.5rem 0 0; color: #666;">This code expires in 5 minutes.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}. It expires in 5 minutes.`,
      html,
    });

    return createSuccessResponse({ email }, 'Verification code sent successfully.');
  } catch (error) {
    console.error('Send verification code error:', error);
    return createErrorResponse('Unable to send verification code.', 500);
  }
}
