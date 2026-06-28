import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/response';

interface ActivityLog {
  _id?: string;
  action: string;
  actor: string;
  actorEmail?: string;
  type: 'order' | 'product' | 'review' | 'user' | 'system';
  details: string;
  timestamp: Date;
  ip?: string;
}

export const dynamic = 'force-dynamic';

// Note: In a production environment, you would store these in a database collection
// For now, we'll use in-memory storage or MongoDB collection
let activityLogs: ActivityLog[] = [];

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();

    // Sort by timestamp (newest first) and limit to 100
    const sortedLogs = activityLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);

    return createSuccessResponse(sortedLogs, 'Activity logs retrieved');
  } catch (error) {
    console.error('Activity logs error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { action, actor, actorEmail, type, details, ip } = body;

    if (!action || !actor || !type || !details) {
      return createErrorResponse('Missing required fields', 400);
    }

    const newLog: ActivityLog = {
      _id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      actor,
      actorEmail,
      type,
      details,
      timestamp: new Date(),
      ip,
    };

    activityLogs.push(newLog);

    // Keep only last 1000 logs in memory
    if (activityLogs.length > 1000) {
      activityLogs = activityLogs.slice(-1000);
    }

    return createSuccessResponse(newLog, 'Activity logged successfully');
  } catch (error) {
    console.error('Activity log creation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
