import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { handle } = await req.json();

        if (!handle) {
            return NextResponse.json(
                { message: 'Please provide a Codeforces handle' },
                { status: 400 }
            );
        }

        // 1. Verify handle exists on Codeforces
        const cfResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const cfData = await cfResponse.json();

        if (cfData.status !== 'OK') {
            return NextResponse.json(
                { message: 'Codeforces handle not found' },
                { status: 404 }
            );
        }

        // 2. Generate Challenge (Problem 4A - Watermelon is a classic choice for this)
        // In a real app, you might randomize this or use a specific "verification" problem.
        const challengeProblem = {
            contestId: 4,
            index: 'A',
            name: 'Watermelon',
            url: 'https://codeforces.com/problemset/problem/4/A'
        };

        return NextResponse.json(
            {
                message: 'Challenge generated',
                problem: challengeProblem
            },
            { status: 200 }
        );

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
