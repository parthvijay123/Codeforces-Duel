import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

// POST — Join a team by invite code
export async function POST(req: NextRequest) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const { inviteCode } = await req.json();
        if (!inviteCode || !inviteCode.trim()) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
        }

        const team = await Team.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
        if (!team) {
            return NextResponse.json({ error: 'Team not found. Check your invite code.' }, { status: 404 });
        }

        // Check if already a member
        if (team.members.some((m: any) => m.toString() === userId)) {
            return NextResponse.json({ error: 'You are already in this team' }, { status: 400 });
        }

        // Check team size (max 3)
        if (team.members.length >= 3) {
            return NextResponse.json({ error: 'Team is full (3/3 members)' }, { status: 400 });
        }

        team.members.push(userId);
        await team.save();

        const populated = await Team.findById(team._id)
            .populate('captain', 'username codeforcesHandle')
            .populate('members', 'username codeforcesHandle');

        return NextResponse.json({ team: populated });
    } catch (error: any) {
        console.error('Join team error:', error);
        return NextResponse.json({ error: error.message || 'Failed to join team' }, { status: 500 });
    }
}
