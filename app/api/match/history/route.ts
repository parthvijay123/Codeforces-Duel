import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Match from '@/models/Match';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: NextRequest) {
    await dbConnect();

    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    let userId: string;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
    } catch {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const skip = (page - 1) * limit;

        const [matches, total] = await Promise.all([
            Match.find({ player: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Match.countDocuments({ player: userId }),
        ]);

        return NextResponse.json({
            matches: matches.map((m: any) => ({
                id: m._id.toString(),
                opponent: m.opponent,
                opponentRating: m.opponentRating,
                problem: m.problem,
                result: m.result,
                ratingBefore: m.ratingBefore,
                ratingAfter: m.ratingAfter,
                ratingChange: m.ratingChange,
                createdAt: m.createdAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        console.error('Match history error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
    }
}
