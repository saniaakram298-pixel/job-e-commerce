import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models/Subscriber';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email || !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return NextResponse.json(
        {
          success: true,
          message: 'You are already subscribed',
          alreadySubscribed: true,
        },
        { status: 200 }
      );
    }

    const newSubscriber = new Subscriber({ email, active: true });
    await newSubscriber.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
        data: newSubscriber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Newsletter Subscription Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to subscribe',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = req.headers.get('authorization')?.split(' ')[1];
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const subscribers = await Subscriber.find({ active: true }).exec();

    return NextResponse.json(
      {
        success: true,
        data: subscribers,
        count: subscribers.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Subscribers Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch subscribers',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await Subscriber.findOneAndUpdate(
      { email },
      { active: false },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully unsubscribed',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Unsubscribe Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to unsubscribe',
      },
      { status: 500 }
    );
  }
}
