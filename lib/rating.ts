export interface MatchRecord {
    id: string;
    date: number;
    opponent: string;
    opponentRating: number;
    problem: {
        name: string;
        rating: number;
        tags: string[];
        url: string;
        index: string;
    };
    result: 'WIN' | 'LOSS' | 'DRAW';
    ratingChange: number;
}

export interface UserStats {
    rating: number;
    history: MatchRecord[];
}

const getStorageKey = (handle: string) => `cf_duel_stats_v1_${handle}`;
const K_FACTOR = 32;

export function getStats(handle: string): UserStats {
    if (typeof window === 'undefined' || !handle) return { rating: 1200, history: [] };

    const stored = localStorage.getItem(getStorageKey(handle));
    if (!stored) {
        return { rating: 1200, history: [] };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return { rating: 1200, history: [] };
    }
}

export function saveStats(handle: string, stats: UserStats) {
    if (typeof window === 'undefined' || !handle) return;
    localStorage.setItem(getStorageKey(handle), JSON.stringify(stats));
}

// 1 = Win, 0 = Loss
export function calculateNewRating(currentRating: number, opponentRating: number, actualScore: number): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const newRating = Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
    return newRating;
}

export function recordMatchResult(
    handle: string,
    opponent: string,
    opponentRating: number,
    problem: MatchRecord['problem'],
    result: 'WIN' | 'LOSS' | 'DRAW'
): UserStats {
    const stats = getStats(handle);
    const score = result === 'WIN' ? 1 : result === 'DRAW' ? 0.5 : 0;
    const newRating = calculateNewRating(stats.rating, opponentRating, score);
    const change = newRating - stats.rating;

    const record: MatchRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        opponent,
        opponentRating,
        problem,
        result,
        ratingChange: change
    };

    const newStats = {
        rating: newRating,
        history: [record, ...stats.history]
    };

    saveStats(handle, newStats);
    return newStats;
}
