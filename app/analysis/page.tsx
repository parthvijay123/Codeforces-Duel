'use client';

import { useEffect, useState } from 'react';
import { getStats, UserStats } from '@/lib/rating';
import { ArrowLeft, TrendingUp, Trophy, Target } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        setStats(getStats());
    }, []);

    if (!stats) return <div className="p-20 text-center">Loading stats...</div>;

    // --- Process Data ---

    // 1. Topic Performance
    const topicStats: { [tag: string]: { total: number; wins: number } } = {};
    stats.history.forEach(match => {
        match.problem.tags.forEach(tag => {
            if (!topicStats[tag]) topicStats[tag] = { total: 0, wins: 0 };
            topicStats[tag].total++;
            if (match.result === 'WIN') topicStats[tag].wins++;
        });
    });

    const sortedTopics = Object.entries(topicStats)
        .map(([tag, data]) => ({
            tag,
            winRate: Math.round((data.wins / data.total) * 100),
            total: data.total
        }))
        .sort((a, b) => b.total - a.total) // Sort by most played first
        .slice(0, 8); // Top 8

    // 2. Rating Chart Data
    // Reverse history to chronologic
    const chronologicHistory = [...stats.history].reverse();
    // Start with 1200
    const dataPoints = [{ r: 1200, i: 0 }, ...chronologicHistory.map((h, i) => {
        // Calculate cumulative rating effectively? 
        // Actually we store change, but we also just have current rating.
        // But history entries only have change.
        // To reconstruct graph, we can walk back from current rating or walk forward from 1200.
        // Wait, calculateNewRating uses current rating.
        // Let's rely on change delta.
        // No, actually, history doesn't store absolute rating at that time in my interface (oops).
        // Good catch. I only stored ratingChange.
        // So: start at 1200.
        // Accumulate.
        return { r: 0, i: i + 1, change: h.ratingChange };
    })];

    let currentR = 1200;
    dataPoints.forEach((p, idx) => {
        if (idx === 0) return;
        currentR += (p as any).change;
        p.r = currentR;
    });

    // SVG Props
    const width = 800;
    const height = 300;
    const padding = 40;
    const maxR = Math.max(...dataPoints.map(d => d.r), 1300);
    const minR = Math.min(...dataPoints.map(d => d.r), 1100);
    const range = maxR - minR;

    const getX = (i: number) => padding + (i / (dataPoints.length - 1 || 1)) * (width - 2 * padding);
    const getY = (r: number) => height - padding - ((r - minR) / range) * (height - 2 * padding);

    const pathD = dataPoints.length > 1
        ? `M ${getX(0)} ${getY(dataPoints[0].r)} ` + dataPoints.slice(1).map(p => `L ${getX(p.i)} ${getY(p.r)}`).join(' ')
        : `M ${padding} ${height / 2} L ${width - padding} ${height / 2}`;

    return (
        <div className="max-w-5xl mx-auto p-8 min-h-screen">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <header className="flex justify-between items-end mb-12 border-b border-gray-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                        <TrendingUp className="text-blue-500" /> Performance Analysis
                    </h1>
                    <p className="text-gray-400">Track your progress and identify strengths.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Current Rating</p>
                    <div className="text-5xl font-black text-white">{stats.rating}</div>
                </div>
            </header>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
                {/* Chart Card */}
                <div className="md:col-span-2 bg-gray-900/40 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" /> Rating History
                    </h3>
                    <div className="relative w-full aspect-[2/1] bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50">
                        {dataPoints.length > 1 ? (
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-blue-500">
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
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Play more matches to see your graph!
                            </div>
                        )}
                    </div>
                </div>

                {/* Topic Stats Card */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" /> Strongest Topics
                    </h3>
                    <div className="space-y-4">
                        {sortedTopics.length > 0 ? sortedTopics.map(t => (
                            <div key={t.tag} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-300 capitalize">{t.tag}</span>
                                    <span className={t.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>{t.winRate}% WR</span>
                                </div>
                                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${t.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ width: `${t.winRate}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-0.5">{t.total} games</p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm">No data yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Match History Table */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6">Recent Matches</h3>
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
                            {stats.history.map(match => (
                                <tr key={match.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 font-mono text-white">{match.opponent}</td>
                                    <td className="py-4 text-gray-300">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{match.problem.name}</span>
                                            <span className="text-xs text-gray-500">{match.problem.index} • {match.problem.rating}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${match.result === 'WIN' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                            {match.result}
                                        </span>
                                    </td>
                                    <td className={`py-4 font-bold text-right ${match.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {match.ratingChange >= 0 ? '+' : ''}{match.ratingChange}
                                    </td>
                                </tr>
                            ))}
                            {stats.history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">No matches recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
