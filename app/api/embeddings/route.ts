import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { FaceEmbedding, Person } from '@/lib/models';
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

    // Update Person's centroid for faster vector search
    const allEmbeddings = await FaceEmbedding.find({ personId, userId: decoded.userId });
    if (allEmbeddings.length > 0) {
      // Filter out any embeddings that might be corrupted or have wrong length
      const validEmbeddings = allEmbeddings.filter(e => e.embedding && e.embedding.length > 0);
      
      if (validEmbeddings.length > 0) {
        const vectorSize = validEmbeddings[0].embedding.length;
        const sumVector = new Array(vectorSize).fill(0);
        
        for (const emb of validEmbeddings) {
          if (emb.embedding.length === vectorSize) {
            for (let i = 0; i < vectorSize; i++) {
              sumVector[i] += emb.embedding[i];
            }
          }
        }
        
        const centroid = sumVector.map(v => v / validEmbeddings.length);
        await Person.findOneAndUpdate(
          { personId, userId: decoded.userId },
          { centroid }
        );
      }
    }

    return NextResponse.json(newEmbedding);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
