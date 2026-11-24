import { NextRequest, NextResponse } from 'next/server';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request: NextRequest) {
  if (STATE_CHANGING_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin && request.cookies.has('atelier_session')) {
      return NextResponse.json({ success: false, message: 'Origin verification required' }, { status: 403 });
    }

    if (origin) {
      if (!host) {
        return NextResponse.json({ success: false, message: 'Origin verification failed' }, { status: 403 });
      }
      try {
        if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
          return NextResponse.json({ success: false, message: 'Cross-origin request rejected' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid request origin' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
