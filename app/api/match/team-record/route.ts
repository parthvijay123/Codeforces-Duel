import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import TeamMatch from '@/models/TeamMatch';
import Team from '@/models/Team';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function getUserId(req: NextRequest): string | null {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch {
        return null;
    }
}

// POST — Record a team match result
// Does NOT affect individual ELO rating, but DOES increment wins/losses
export async function POST(req: NextRequest) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const { teamId, opponentTeamName, problem, result, members } = await req.json();

        if (!teamId || !opponentTeamName || !problem || !result) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['WIN', 'LOSS', 'DRAW'].includes(result)) {
            return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
        }

        // Verify team exists and user is a member
        const team = await Team.findById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        if (!team.members.some((m: any) => m.toString() === userId)) {
            return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
        }

        // Create TeamMatch record
        const match = await TeamMatch.create({
            team: teamId,
            teamName: team.name,
            opponentTeamName,
            problem: {
                name: problem.name,
                rating: problem.rating || 0,
                tags: problem.tags || [],
                url: problem.url || '',
                index: problem.index || '',
                contestId: problem.contestId || 0,
            },
            result,
            members: members || [],
        });

        // Update wins/losses for all team members (NO rating change)
        const incField = result === 'WIN' ? 'wins' : result === 'LOSS' ? 'losses' : 'draws';
        await User.updateMany(
            { _id: { $in: team.members } },
            { $inc: { [incField]: 1 } }
        );

        return NextResponse.json({
            match: {
                id: match._id,
                teamName: match.teamName,
                opponentTeamName: match.opponentTeamName,
                result: match.result,
                problem: match.problem,
                createdAt: match.createdAt,
            },
        });
    } catch (error: any) {
        console.error('Team match record error:', error);
        return NextResponse.json({ error: error.message || 'Failed to record team match' }, { status: 500 });
    }
}
