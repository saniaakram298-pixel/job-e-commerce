import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from './auth';
import { connectDB } from './mongodb';
import { User } from '@/models/User';

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message, error: message }, { status });
}

export function createSuccessResponse<T>(data: T, message: string = 'Success', status: number = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value || null;
}

export function getUserIdFromToken(token: string): string | null {
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function requireAuthenticatedUser(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return {
      user: null,
      response: createErrorResponse('Unauthorized', 401),
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      user: null,
      response: createErrorResponse('Invalid authentication session', 401),
    };
  }

  try {
    const connection = await connectDB();
    if (!connection) {
      return {
        user: null,
        response: createErrorResponse('Database temporarily unavailable', 503),
      };
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return {
        user: null,
        response: createErrorResponse('User not found', 401),
      };
    }

    return { user, response: null };
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return {
      user: null,
      response: createErrorResponse('Unable to verify session', 503),
    };
  }
}

export async function requireAdminUser(request: NextRequest) {
  const result = await requireAuthenticatedUser(request);
  if (result.response) return result;
  if (result.user.role !== 'admin') {
    return {
      user: null,
      response: createErrorResponse('Admin access required', 403),
    };
  }
  return result;
}
