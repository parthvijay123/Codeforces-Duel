import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: NextRequest) {
    await dbConnect();

    // 1. Authenticate User
    const token = req.cookies.get('token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    let userId;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
    } catch (err) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    try {
        const { handle } = await req.json();

        if (!handle) {
            return NextResponse.json(
                { message: 'Please provide the handle being verified' },
                { status: 400 }
            );
        }

        // 2. Fetch User Status from Codeforces
        const cfResponse = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5`);
        const cfData = await cfResponse.json();

        if (cfData.status !== 'OK') {
            return NextResponse.json(
                { message: 'Could not fetch user status from Codeforces' },
                { status: 500 }
            );
        }

        const submissions = cfData.result;

        // 3. Verify Submission
        // We are looking for a submission to problem 4A within the last 5 minutes (300 seconds)
        // Note: Codeforces API returns creationTimeSeconds in Unix timestamp (seconds)
        const currentTimeSeconds = Math.floor(Date.now() / 1000);
        const timeLimit = 300; // 5 minutes

        const verifiedSubmission = submissions.find((sub: any) => {
            const isTargetProblem = sub.problem.contestId === 4 && sub.problem.index === 'A';
            const isRecent = (currentTimeSeconds - sub.creationTimeSeconds) < timeLimit;
            return isTargetProblem && isRecent;
        });

        if (!verifiedSubmission) {
            return NextResponse.json(
                { message: 'No recent submission to problem 4A found. Please submit and try again.' },
                { status: 400 }
            );
        }

        // 4. Update User in DB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                codeforcesHandle: handle,
                isVerified: true
            },
            { new: true }
        );

        return NextResponse.json(
            {
                message: 'Handle verified successfully!',
                user: {
                    username: updatedUser.username,
                    email: updatedUser.email,
                    codeforcesHandle: updatedUser.codeforcesHandle,
                    isVerified: updatedUser.isVerified
                }
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { message: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
