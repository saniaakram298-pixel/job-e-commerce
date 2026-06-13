import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    await connectDB();

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse(user, 'User profile fetched successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { firstName, lastName, phone, addresses } = body;

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(addresses && { addresses }),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse(user, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
