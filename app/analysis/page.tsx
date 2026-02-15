'use client';

import { useEffect, useState } from 'react';
import { fetchMatchHistory, ServerMatchRecord } from '@/lib/rating';
import { ArrowLeft, TrendingUp, Trophy, Target, AlertTriangle, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AnalysisPage() {
    return (
        <ProtectedRoute>
            <AnalysisContent />
        </ProtectedRoute>
    );
}

function AnalysisContent() {
    const { user } = useUser();
    const handle = user?.codeforcesHandle || '';
    const userRating = user?.rating || 1200;

    const [matches, setMatches] = useState<ServerMatchRecord[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [cfTopics, setCfTopics] = useState<{tag: string, total: number, winRate: number}[]>([]);
    const [practiceProblems, setPracticeProblems] = useState<any[]>([]);
    const [loadingCf, setLoadingCf] = useState(false);

    // Fetch match history from server
    useEffect(() => {
        if (!handle) return;
        const loadHistory = async () => {
            setLoadingMatches(true);
            try {
                const data = await fetchMatchHistory(1, 100);
                setMatches(data.matches);
            } catch (e) {
                console.error('Failed to fetch match history:', e);
            } finally {
                setLoadingMatches(false);
            }
        };
        loadHistory();
    }, [handle]);

    // Fetch Codeforces topic stats
    useEffect(() => {
        if (!handle) return;
        const fetchCFStats = async () => {
            setLoadingCf(true);
            try {
                // Fetch recent submissions
                const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`);
                const data = await res.json();
                if (data.status === 'OK') {
                    const submissions = data.result;
                    const tagStats: Record<string, { total: number; solved: number }> = {};
                    
                    submissions.forEach((sub: any) => {
                        const isAC = sub.verdict === 'OK';
                        sub.problem.tags?.forEach((tag: string) => {
                            if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
                            tagStats[tag].total++;
                            if (isAC) tagStats[tag].solved++;
                        });
                    });

                    const topicsArray = Object.entries(tagStats)
                        .map(([tag, st]) => ({
                            tag,
                            total: st.total,
                            winRate: Math.round((st.solved / st.total) * 100)
                        }))
                        .filter(t => t.total >= 5) // at least 5 attempts
                        .sort((a, b) => b.total - a.total);

                    setCfTopics(topicsArray);

                    // Pick weakest topic and fetch practice problems
                    const weakest = [...topicsArray].sort((a, b) => a.winRate - b.winRate).find(t => t.total >= 10);
                    if (weakest) {
                        const probRes = await fetch(`https://codeforces.com/api/problemset.problems?tags=${weakest.tag}`);
                        const probData = await probRes.json();
                        if (probData.status === 'OK') {
                            // Filter problems user hasn't solved (rough heuristic: pick random from matching tag within user's rating + 200)
                            const suitable = probData.result.problems.filter((p: any) => p.rating && p.rating >= userRating && p.rating <= userRating + 200);
                            // Pick top 3 random
                            const selected = suitable.sort(() => 0.5 - Math.random()).slice(0, 3);
                            setPracticeProblems(selected);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch CF stats:", e);
            } finally {
                setLoadingCf(false);
            }
        };
        fetchCFStats();
    }, [handle, userRating]);

    if (loadingMatches) return <div className="p-20 text-center flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Loading stats...</div>;

    // --- Process Duel Data from server matches ---
    const topicStats: { [tag: string]: { total: number; wins: number } } = {};
    matches.forEach(match => {
        match.problem.tags.forEach(tag => {
            if (!topicStats[tag]) topicStats[tag] = { total: 0, wins: 0 };
            topicStats[tag].total++;
            if (match.result === 'WIN') topicStats[tag].wins++;
        });
    });

    const displayTopics = cfTopics.length > 0 ? cfTopics : Object.entries(topicStats)
        .map(([tag, data]) => ({
            tag,
            winRate: Math.round((data.wins / data.total) * 100),
            total: data.total
        }))
        .sort((a, b) => b.total - a.total);

    const strongestTopics = [...displayTopics].sort((a, b) => b.winRate - a.winRate).slice(0, 4);
    const weakestTopics = [...displayTopics].sort((a, b) => a.winRate - b.winRate).slice(0, 4);

    // Rating Chart Data from server matches (chronological order)
    const chronologicHistory = [...matches].reverse();
    const dataPoints = [{ r: chronologicHistory.length > 0 ? chronologicHistory[0].ratingBefore : userRating, i: 0 }, ...chronologicHistory.map((h, i) => {
        return { r: h.ratingAfter, i: i + 1 };
    })];

    const width = 800;
    const height = 300;
    const padding = 40;
    const maxR = Math.max(...dataPoints.map(d => d.r), 1300);
    const minR = Math.min(...dataPoints.map(d => d.r), 1100);
    const range = maxR - minR || 100;

    const getX = (i: number) => padding + (i / (dataPoints.length - 1 || 1)) * (width - 2 * padding);
    const getY = (r: number) => height - padding - ((r - minR) / range) * (height - 2 * padding);

    const pathD = dataPoints.length > 1
        ? `M ${getX(0)} ${getY(dataPoints[0].r)} ` + dataPoints.slice(1).map(p => `L ${getX(p.i)} ${getY(p.r)}`).join(' ')
        : `M ${padding} ${height / 2} L ${width - padding} ${height / 2}`;

    return (
        <div className="max-w-6xl mx-auto p-8 min-h-screen">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <header className="flex justify-between items-end mb-12 border-b border-gray-800 pb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                        <TrendingUp className="text-blue-500" /> Performance Analysis
                    </h1>
                    <p className="text-gray-400">Track your progress and identify strengths for <span className="font-bold text-white">{handle}</span>.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Current Rating</p>
                    <div className="text-5xl font-black text-white">{userRating}</div>
                    {user && (
                        <p className="text-xs text-gray-500 mt-1">{user.wins}W / {user.losses}L / {user.draws}D</p>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
                {/* Chart Card */}
                <div className="lg:col-span-2 glass-panel rounded-3xl p-8 transition-transform hover:-translate-y-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" /> Duel Rating History
                    </h3>
                    <div className="relative w-full flex-1 min-h-[200px] bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50">
                        {dataPoints.length > 1 ? (
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-blue-500 absolute inset-0 preserve-3d">
                                {/* Grid Lines */}
                                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="1" />
                                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="1" />

                                {/* Path */}
                                <path d={pathD} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Points */}
                                {dataPoints.map((p, i) => (
                                    <circle key={i} cx={getX(p.i)} cy={getY(p.r)} r="4" className="fill-blue-400" />
                                ))}
                            </svg>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 absolute inset-0">
                                Play more matches to see your graph!
                            </div>
                        )}
                    </div>
                </div>

                {/* Topic Stats Card */}
                <div className="flex flex-col gap-8">
                    {/* Strong Topics */}
                    <div className="glass-panel rounded-3xl p-8 transition-transform hover:-translate-y-1 flex-1">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-green-500" /> Strongest Topics
                        </h3>
                        {loadingCf ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
                        ) : (
                            <div className="space-y-4">
                                {strongestTopics.length > 0 ? strongestTopics.map(t => (
                                    <div key={t.tag} className="group">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300 capitalize truncate pr-2">{t.tag}</span>
                                            <span className="text-green-400 shrink-0">{t.winRate}% AC</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-green-500" style={{ width: `${t.winRate}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-0.5">{t.total} submissions</p>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm">No data yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Weak Topics */}
                    <div className="glass-panel rounded-3xl p-8 transition-transform hover:-translate-y-1 flex-1">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" /> Weakest Topics
                        </h3>
                        {loadingCf ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
                        ) : (
                            <div className="space-y-4">
                                {weakestTopics.length > 0 ? weakestTopics.map(t => (
                                    <div key={t.tag} className="group">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300 capitalize truncate pr-2">{t.tag}</span>
                                            <span className="text-red-400 shrink-0">{t.winRate}% AC</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-red-500" style={{ width: `${t.winRate}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-0.5">{t.total} submissions</p>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm">No data yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Practice Problems Section */}
            {practiceProblems.length > 0 && (
                <div className="glass-panel rounded-3xl p-8 mb-12 transition-transform hover:-translate-y-1 border-purple-500/30">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                        <BookOpen className="w-5 h-5" /> Recommended Practice
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm">Based on your weakest topics, here are some problems matching your rating:</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        {practiceProblems.map(p => (
                            <a 
                                key={`${p.contestId}-${p.index}`} 
                                href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 p-4 rounded-xl transition-all block group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">{p.name}</span>
                                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400 shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-xs font-mono bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Rating: {p.rating}</span>
                                    <span className="text-xs text-gray-500 truncate">{p.tags?.[0]}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Match History Table */}
            <div className="glass-panel rounded-3xl p-8 transition-transform hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-6">Recent Duels</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-500 uppercase border-b border-gray-800">
                            <tr>
                                <th className="pb-4 font-bold">Opponent</th>
                                <th className="pb-4 font-bold">Problem</th>
                                <th className="pb-4 font-bold">Result</th>
                                <th className="pb-4 font-bold text-right">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {matches.map(match => (
                                <tr key={match.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 font-mono text-white">{match.opponent}</td>
                                    <td className="py-4 text-gray-300">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{match.problem.name}</span>
                                            <span className="text-xs text-gray-500">{match.problem.index} • {match.problem.rating}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${match.result === 'WIN' ? 'bg-green-500/10 text-green-400' : match.result === 'DRAW' ? 'bg-gray-500/10 text-gray-400' : 'bg-red-500/10 text-red-500'}`}>
                                            {match.result}
                                        </span>
                                    </td>
                                    <td className={`py-4 font-bold text-right ${match.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {match.ratingChange >= 0 ? '+' : ''}{match.ratingChange}
                                    </td>
                                </tr>
                            ))}
                            {matches.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">No duels recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
