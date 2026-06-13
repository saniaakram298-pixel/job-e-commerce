import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, message, error: message }, { status });
}

export function createSuccessResponse<T>(data: T, message: string = 'Success', status: number = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

export function getUserIdFromToken(token: string): string | null {
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}
