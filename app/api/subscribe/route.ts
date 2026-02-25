import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Subscription } from '@/lib/models';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();
    await Subscription.create({ email });

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
