import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
    
    const persons = await Person.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(decoded.userId) } },
      {
        $lookup: {
          from: 'faceembeddings',
          localField: 'personId',
          foreignField: 'personId',
          as: 'photos'
        }
      },
      {
        $project: {
          _id: 1,
          personId: 1,
          name: 1,
          thumbnailUrl: 1,
          centroid: 1,
          createdAt: 1,
          photoCount: { $size: '$photos' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

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

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const personId = searchParams.get('personId');

    await dbConnect();
    
    if (personId) {
      // Delete specific person and their embeddings
      await Promise.all([
        Person.deleteOne({ userId: decoded.userId, personId }),
        FaceEmbedding.deleteMany({ userId: decoded.userId, personId })
      ]);
      return NextResponse.json({ message: 'Person deleted' });
    } else {
      // Delete all persons and embeddings for this user
      await Promise.all([
        Person.deleteMany({ userId: decoded.userId }),
        FaceEmbedding.deleteMany({ userId: decoded.userId })
      ]);
      return NextResponse.json({ message: 'All data cleared' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
