import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import TeamMatch from '@/models/TeamMatch';
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

// GET — Team detail with match history
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const { id } = await params;
        const team = await Team.findById(id)
            .populate('captain', 'username codeforcesHandle')
            .populate('members', 'username codeforcesHandle')
            .lean();

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Fetch match history
        const matches = await TeamMatch.find({ team: id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({
            team: {
                id: (team as any)._id.toString(),
                name: (team as any).name,
                inviteCode: (team as any).inviteCode,
                captain: (team as any).captain,
                members: (team as any).members,
                createdAt: (team as any).createdAt,
            },
            matches: matches.map((m: any) => ({
                id: m._id.toString(),
                opponentTeamName: m.opponentTeamName,
                problem: m.problem,
                result: m.result,
                members: m.members,
                createdAt: m.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('Team detail error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch team' }, { status: 500 });
    }
}

// DELETE — Disband team (captain only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const { id } = await params;
        const team = await Team.findById(id);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        if (team.captain.toString() !== userId) {
            return NextResponse.json({ error: 'Only the captain can disband the team' }, { status: 403 });
        }

        await Team.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Team disbanded' });
    } catch (error: any) {
        console.error('Delete team error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete team' }, { status: 500 });
    }
}
