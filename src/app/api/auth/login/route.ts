import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AUTH_COOKIE_NAME, comparePasswords, generateToken, getAuthCookieOptions } from '@/lib/auth';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return createErrorResponse('Email and password required', 400);
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return createErrorResponse('Invalid email or password', 401);
    }

    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return createErrorResponse('Invalid email or password', 401);
    }

    const token = generateToken(user._id.toString());

    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const response = createSuccessResponse({ user: userData }, 'Login successful');
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
