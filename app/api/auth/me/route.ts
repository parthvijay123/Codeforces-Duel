import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: NextRequest) {
    await dbConnect();

    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json(
            { message: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    username: user.username,
                    email: user.email,
                    codeforcesHandle: user.codeforcesHandle,
                    isVerified: user.isVerified
                }
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Invalid token' },
            { status: 401 }
        );
    }
}
