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
    };
    result: 'WIN' | 'LOSS';
    ratingChange: number;
}

export interface UserStats {
    rating: number;
    history: MatchRecord[];
}

const STORAGE_KEY = 'cf_duel_stats_v1';
const K_FACTOR = 32;

export function getStats(): UserStats {
    if (typeof window === 'undefined') return { rating: 1200, history: [] };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return { rating: 1200, history: [] };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return { rating: 1200, history: [] };
    }
}

export function saveStats(stats: UserStats) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// 1 = Win, 0 = Loss
export function calculateNewRating(currentRating: number, opponentRating: number, actualScore: number): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    const newRating = Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
    return newRating;
}

export function recordMatchResult(
    opponent: string,
    opponentRating: number,
    problem: MatchRecord['problem'],
    result: 'WIN' | 'LOSS'
): UserStats {
    const stats = getStats();
    const score = result === 'WIN' ? 1 : 0;
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

    saveStats(newStats);
    return newStats;
}
