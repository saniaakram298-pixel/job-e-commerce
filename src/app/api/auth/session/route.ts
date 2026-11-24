import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const connection = await connectDB();
    if (!connection) {
      return createErrorResponse('Database temporarily unavailable', 503);
    }

    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    return createSuccessResponse({
      user: {
        ...user,
        _id: String(user._id),
      },
    });
  } catch (error) {
    console.error('Session lookup failed:', error);
    return createErrorResponse('Unable to verify session', 503);
  }
}
