import { NextRequest, NextResponse } from 'next/server';

// Language IDs for Judge0
// 54 = C++ (GCC 9.2.0)
// 71 = Python 3
// 62 = Java
// 63 = JavaScript (Node.js)
const LANG_MAP: Record<string, number> = {
    'cpp': 54,
    'python': 71,
    'java': 62,
    'javascript': 63,
};

const JUDGE0_URL = 'https://ce.judge0.com';

interface TestResult {
    input: string;
    expected: string;
    got: string | null;
    passed: boolean;
    stderr: string | null;
    compile_output: string | null;
    status: string;
    time: string | null;
}

async function runOnJudge0(source_code: string, language_id: number, stdin: string): Promise<any> {
    const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code, language_id, stdin }),
    });
    return res.json();
}

export async function POST(req: NextRequest) {
    try {
        const { code, language = 'cpp', samples } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }
        if (!samples || samples.length === 0) {
            return NextResponse.json({ error: 'No sample test cases provided' }, { status: 400 });
        }

        const language_id = LANG_MAP[language] || 54;

        const results: TestResult[] = await Promise.all(
            samples.map(async (sample: { input: string; output: string }) => {
                const res = await runOnJudge0(code, language_id, sample.input);

                const got = (res.stdout || '').trim();
                const expected = (sample.output || '').trim();

                return {
                    input: sample.input,
                    expected,
                    got,
                    passed: got === expected,
                    stderr: res.stderr || null,
                    compile_output: res.compile_output || null,
                    status: res.status?.description || 'Unknown',
                    time: res.time || null,
                };
            })
        );

        const allPassed = results.every(r => r.passed);
        const hasCompileError = results.some(r => r.compile_output);

        return NextResponse.json({
            allPassed,
            hasCompileError,
            results,
        });

    } catch (error: any) {
        console.error('Execute error:', error);
        return NextResponse.json({ error: error.message || 'Execution failed' }, { status: 500 });
    }
}
