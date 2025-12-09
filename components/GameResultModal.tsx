import { useState, useEffect } from 'react';
import { Trophy, XCircle, ArrowRight, RefreshCw, Home } from 'lucide-react';
import { recordMatchResult, UserStats } from '@/lib/rating';
import { Problem } from '@/lib/codeforces';

interface GameResultModalProps {
    result: 'WIN' | 'LOSS' | 'DRAW';
    opponent: string;
    opponentRating: number;
    problem: Problem;
    onClose: () => void;
}

export function GameResultModal({ result, opponent, opponentRating, problem, onClose }: GameResultModalProps) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [ratingChange, setRatingChange] = useState<number>(0);

    useEffect(() => {
        // Record result ONCE when modal opens
        // Construct the problem object expected by rating system
        const ratingProblem = {
            name: problem.name,
            rating: problem.rating || 0,
            tags: problem.tags,
            url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
            index: problem.index
        };

        const newStats = recordMatchResult(opponent, opponentRating, ratingProblem, result);
        setStats(newStats);
        setRatingChange(newStats.history[0].ratingChange);
    }, []); // Empty dependency array ensures it runs once on mount

    if (!stats) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"></div>

            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 p-8 text-left shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center">
                    {result === 'WIN' ? (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 mb-6 ring-4 ring-yellow-500/20">
                            <Trophy className="h-10 w-10 text-yellow-500" />
                        </div>
                    ) : result === 'DRAW' ? (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 mb-6 ring-4 ring-blue-500/20">
                            <RefreshCw className="h-10 w-10 text-blue-500" />
                        </div>
                    ) : (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-6 ring-4 ring-red-500/20">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                    )}

                    <h3
                        className={`text-4xl font-extrabold leading-6 mb-2 ${result === 'WIN' ? 'text-yellow-500' : result === 'DRAW' ? 'text-blue-500' : 'text-red-500'}`}
                    >
                        {result === 'WIN' ? 'VICTORY!' : result === 'DRAW' ? 'DRAW' : 'DEFEAT'}
                    </h3>

                    <p className="text-gray-400 mb-8">
                        {result === 'WIN' ? `You crushed ${opponent}!` : result === 'DRAW' ? `It's a tie with ${opponent}.` : `Better luck next time against ${opponent}.`}
                    </p>

                    {/* Rating Change Card */}
                    <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                        <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">New Rating</p>
                        <div className="flex items-center justify-center gap-4 text-3xl font-black">
                            <span className="text-white">{stats.rating}</span>
                            <span className={`text-lg px-3 py-1 rounded-full flex items-center ${ratingChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {ratingChange >= 0 ? '+' : ''}{ratingChange}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            className="inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-white px-4 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all hover:scale-[1.02]"
                            onClick={onClose}
                        >
                            <RefreshCw className="w-4 h-4" /> Play Again
                        </button>
                        <a
                            href="/analysis"
                            className="inline-flex justify-center items-center gap-2 rounded-xl border border-gray-700 bg-transparent px-4 py-4 text-sm font-bold text-gray-300 hover:bg-gray-800 transition-all"
                        >
                            <ArrowRight className="w-4 h-4" /> View Analysis
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
