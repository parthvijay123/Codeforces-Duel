import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Match from '@/models/Match';
import jwt from 'jsonwebtoken';
import { calculateNewRating } from '@/lib/rating';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: NextRequest) {
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
        const { opponent, opponentRating, problem, result } = await req.json();

        // Validate required fields
        if (!opponent || opponentRating === undefined || !problem || !result) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['WIN', 'LOSS', 'DRAW'].includes(result)) {
            return NextResponse.json({ error: 'Invalid result value' }, { status: 400 });
        }

        // Get the current user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Calculate new rating server-side
        const currentRating = user.rating || 1200;
        const score = result === 'WIN' ? 1 : result === 'DRAW' ? 0.5 : 0;
        const newRating = calculateNewRating(currentRating, opponentRating, score);
        const ratingChange = newRating - currentRating;

        // Create the match record
        const match = await Match.create({
            player: user._id,
            playerHandle: user.codeforcesHandle || user.username,
            opponent,
            opponentRating,
            problem: {
                name: problem.name,
                rating: problem.rating || 0,
                tags: problem.tags || [],
                url: problem.url || '',
                index: problem.index || '',
                contestId: problem.contestId || 0,
            },
            result,
            ratingBefore: currentRating,
            ratingAfter: newRating,
            ratingChange,
        });

        // Update user rating and stats atomically
        const statsUpdate: any = { rating: newRating };
        if (result === 'WIN') statsUpdate.$inc = { wins: 1 };
        else if (result === 'LOSS') statsUpdate.$inc = { losses: 1 };
        else statsUpdate.$inc = { draws: 1 };

        // Use findByIdAndUpdate for atomic operation
        await User.findByIdAndUpdate(userId, {
            $set: { rating: newRating },
            $inc: {
                wins: result === 'WIN' ? 1 : 0,
                losses: result === 'LOSS' ? 1 : 0,
                draws: result === 'DRAW' ? 1 : 0,
            }
        });

        return NextResponse.json({
            newRating,
            ratingChange,
            match: {
                id: match._id,
                opponent: match.opponent,
                result: match.result,
                ratingBefore: match.ratingBefore,
                ratingAfter: match.ratingAfter,
                ratingChange: match.ratingChange,
                problem: match.problem,
                createdAt: match.createdAt,
            }
        });
    } catch (error: any) {
        console.error('Match record error:', error);
        return NextResponse.json({ error: error.message || 'Failed to record match' }, { status: 500 });
    }
}
