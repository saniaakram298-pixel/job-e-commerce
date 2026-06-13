import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { hashPassword, comparePasswords, generateToken } from '@/lib/auth';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return createErrorResponse('Missing required fields', 400);
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createErrorResponse('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Return user data without password
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return createSuccessResponse(
      {
        token,
        user: userData,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
