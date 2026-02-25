import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Person, FaceEmbedding } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const persons = await Person.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    return NextResponse.json(persons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { personId, name, thumbnailUrl } = await req.json();
    
    await dbConnect();
    const person = await Person.findOneAndUpdate(
      { userId: decoded.userId, personId },
      { name, thumbnailUrl },
      { upsert: true, new: true }
    );

    return NextResponse.json(person);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
