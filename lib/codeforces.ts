export interface Problem {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
}

export interface Submission {
    id: number;
    contestId: number;
    creationTimeSeconds: number;
    relativeTimeSeconds: number;
    problem: Problem;
    author: {
        contestId: number;
        members: { handle: string }[];
        participantType: string;
        ghost: boolean;
    };
    programmingLanguage: string;
    verdict: string;
    testset: string;
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
}

export async function getUserRating(handle: string): Promise<number | null> {
    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`, { next: { revalidate: 3600 } });
        const data = await res.json();
        if (data.status === 'OK') {
            return data.result[0].rating;
        }
    } catch (error) {
        console.error("Error fetching user rating:", error);
    }
    return null;
}

export async function getRandomProblem(rating: number): Promise<Problem | null> {
    try {
        // Fetching all problems is heavy, but cached for 24h
        // In a real app, this should be a backend job or filtered more efficiently.
        const res = await fetch('https://codeforces.com/api/problemset.problems', { next: { revalidate: 86400 } });
        const data = await res.json();
        if (data.status === 'OK') {
            const problems = data.result.problems as Problem[];
            const filtered = problems.filter(p => p.rating === rating);
            if (filtered.length === 0) return null;
            const random = filtered[Math.floor(Math.random() * filtered.length)];
            return random;
        }
    } catch (e) {
        console.error("Error fetching problems:", e);
    }
    return null;
}

export async function checkSubmission(handle: string, contestId: number, index: string): Promise<boolean> {
    try {
        const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10`, { cache: 'no-store' });
        const data = await res.json();
        if (data.status === 'OK') {
            const submissions = data.result as Submission[];
            const solved = submissions.some(s =>
                s.problem.contestId === contestId &&
                s.problem.index === index &&
                s.verdict === 'OK'
            );
            return solved;
        }
    } catch (error) {
        console.error("Error checking submissions:", error);
    }
    return false;
}
