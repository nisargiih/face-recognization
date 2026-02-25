import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
