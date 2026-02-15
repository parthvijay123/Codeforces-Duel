import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

        const leaderboard = await User.find({
            codeforcesHandle: { $exists: true, $ne: null },
        })
            .sort({ rating: -1 })
            .limit(limit)
            .select('username codeforcesHandle rating wins losses draws')
            .lean();

        return NextResponse.json({
            leaderboard: leaderboard.map((u: any, index: number) => ({
                rank: index + 1,
                username: u.username,
                codeforcesHandle: u.codeforcesHandle,
                rating: u.rating || 1200,
                wins: u.wins || 0,
                losses: u.losses || 0,
                draws: u.draws || 0,
            })),
        });
    } catch (error: any) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
