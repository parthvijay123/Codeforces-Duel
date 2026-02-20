import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Team from '@/models/Team';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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

// POST — Create a new team
// GET — List teams for authenticated user
export async function POST(req: NextRequest) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const { name } = await req.json();
        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
        }

        // Generate unique invite code
        let inviteCode = generateInviteCode();
        let attempts = 0;
        while (await Team.findOne({ inviteCode }) && attempts < 10) {
            inviteCode = generateInviteCode();
            attempts++;
        }

        const team = await Team.create({
            name: name.trim(),
            inviteCode,
            captain: userId,
            members: [userId],
        });

        const populated = await Team.findById(team._id)
            .populate('captain', 'username codeforcesHandle')
            .populate('members', 'username codeforcesHandle');

        return NextResponse.json({ team: populated }, { status: 201 });
    } catch (error: any) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create team' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    await dbConnect();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

    try {
        const teams = await Team.find({ members: userId })
            .populate('captain', 'username codeforcesHandle')
            .populate('members', 'username codeforcesHandle')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            teams: teams.map((t: any) => ({
                id: t._id.toString(),
                name: t.name,
                inviteCode: t.inviteCode,
                captain: {
                    username: t.captain.username,
                    codeforcesHandle: t.captain.codeforcesHandle,
                },
                members: t.members.map((m: any) => ({
                    username: m.username,
                    codeforcesHandle: m.codeforcesHandle,
                })),
                memberCount: t.members.length,
                createdAt: t.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('List teams error:', error);
        return NextResponse.json({ error: error.message || 'Failed to list teams' }, { status: 500 });
    }
}
