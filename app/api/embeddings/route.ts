import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { FaceEmbedding } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const embeddings = await FaceEmbedding.find({ userId: decoded.userId });
    return NextResponse.json(embeddings);
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

    const { personId, embedding, imageUrl, source } = await req.json();
    
    await dbConnect();
    const newEmbedding = await FaceEmbedding.create({
      userId: decoded.userId,
      personId,
      embedding,
      imageUrl,
      source,
    });

    return NextResponse.json(newEmbedding);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
