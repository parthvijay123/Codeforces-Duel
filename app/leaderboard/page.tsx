'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, ChevronUp, ChevronDown, Minus, Loader2, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

interface LeaderboardEntry {
    rank: number;
    username: string;
    codeforcesHandle: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
}

export default function LeaderboardPage() {
    const { user } = useUser();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/leaderboard?limit=50');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLeaderboard(data.leaderboard);
            } catch (e: any) {
                setError(e.message || 'Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={20} color="#FFD700" strokeWidth={2.5} />;
        if (rank === 2) return <Medal size={20} color="#C0C0C0" strokeWidth={2.5} />;
        if (rank === 3) return <Medal size={20} color="#CD7F32" strokeWidth={2.5} />;
        return <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', width: '20px', textAlign: 'center', display: 'inline-block' }}>{rank}</span>;
    };

    const getRankBg = (rank: number) => {
        if (rank === 1) return 'rgba(255, 215, 0, 0.04)';
        if (rank === 2) return 'rgba(192, 192, 192, 0.03)';
        if (rank === 3) return 'rgba(205, 127, 50, 0.03)';
        return 'transparent';
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 2400) return '#ff0000';      // Red
        if (rating >= 2100) return '#FF8C00';       // Orange
        if (rating >= 1900) return '#aa00aa';       // Violet
        if (rating >= 1600) return '#0000ff';       // Blue
        if (rating >= 1400) return '#03a89e';       // Cyan
        if (rating >= 1200) return '#008000';       // Green
        return '#808080';                           // Gray (Newbie)
    };

    const totalGames = (e: LeaderboardEntry) => e.wins + e.losses + e.draws;
    const winRate = (e: LeaderboardEntry) => {
        const total = totalGames(e);
        return total > 0 ? Math.round((e.wins / total) * 100) : 0;
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px', width: '100%' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'var(--accent-dim)',
                        border: '1px solid rgba(204, 255, 0, 0.2)',
                        borderRadius: '9999px',
                        padding: '8px 20px',
                        marginBottom: '24px',
                    }}>
                        <Trophy size={16} color="var(--accent)" strokeWidth={2.5} />
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Rankings
                        </span>
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
                        Global Leaderboard
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        Top competitors ranked by Duel ELO rating.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                        {leaderboard.length}
                    </div>
                    <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>Players Ranked</div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '96px 0', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.1rem', fontWeight: 600 }}>Loading leaderboard…</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ textAlign: 'center', padding: '96px 32px', border: '2px dashed var(--border-color)', borderRadius: '2rem' }}>
                    <p style={{ fontSize: '1.1rem', color: 'var(--danger)', fontWeight: 700 }}>{error}</p>
                </div>
            )}

            {/* Leaderboard Table */}
            {!loading && !error && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 140px 120px 100px',
                        padding: '20px 32px',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--surface-raised)',
                    }}>
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rank</span>
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Player</span>
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rating</span>
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Record</span>
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Win Rate</span>
                    </div>

                    {/* Table Rows */}
                    {leaderboard.map((entry) => {
                        const isCurrentUser = user?.codeforcesHandle === entry.codeforcesHandle || user?.username === entry.username;
                        const wr = winRate(entry);

                        return (
                            <div
                                key={entry.username}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 140px 120px 100px',
                                    padding: '20px 32px',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: isCurrentUser ? 'var(--accent-dim)' : getRankBg(entry.rank),
                                    transition: 'background 0.2s ease',
                                    alignItems: 'center',
                                    cursor: 'default',
                                }}
                                onMouseEnter={e => {
                                    if (!isCurrentUser) (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
                                }}
                                onMouseLeave={e => {
                                    if (!isCurrentUser) (e.currentTarget as HTMLElement).style.background = getRankBg(entry.rank);
                                }}
                            >
                                {/* Rank */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {getRankIcon(entry.rank)}
                                </div>

                                {/* Player Info */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontFamily: 'var(--font-inter)',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: isCurrentUser ? 'var(--accent)' : 'var(--text-primary)',
                                        }}>
                                            {entry.codeforcesHandle || entry.username}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="badge badge-lime" style={{ fontSize: '0.65rem' }}>You</span>
                                        )}
                                        {entry.rank <= 3 && (
                                            <span className={`badge ${entry.rank === 1 ? 'badge-lime' : entry.rank === 2 ? 'badge-gray' : 'badge-orange'}`} style={{ fontSize: '0.65rem' }}>
                                                {entry.rank === 1 ? 'Champion' : entry.rank === 2 ? 'Runner Up' : 'Bronze'}
                                            </span>
                                        )}
                                    </div>
                                    {entry.codeforcesHandle && entry.username !== entry.codeforcesHandle && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{entry.username}</span>
                                    )}
                                </div>

                                {/* Rating */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontFamily: 'var(--font-jakarta)',
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        color: getRatingColor(entry.rating),
                                    }}>
                                        {entry.rating}
                                    </span>
                                </div>

                                {/* W/L/D Record */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-inter)' }}>
                                    <span style={{ color: 'var(--success)' }}>{entry.wins}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                                    <span style={{ color: 'var(--danger)' }}>{entry.losses}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{entry.draws}</span>
                                </div>

                                {/* Win Rate */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '6px',
                                            background: 'var(--surface-raised)',
                                            borderRadius: '9999px',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${wr}%`,
                                                background: wr >= 60 ? 'var(--success)' : wr >= 40 ? 'var(--accent)' : 'var(--danger)',
                                                borderRadius: '9999px',
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-jakarta)',
                                            fontSize: '0.9rem',
                                            fontWeight: 800,
                                            color: wr >= 60 ? 'var(--success)' : wr >= 40 ? 'var(--text-secondary)' : 'var(--danger)',
                                            minWidth: '32px',
                                        }}>
                                            {totalGames(entry) > 0 ? `${wr}%` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {leaderboard.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '96px 32px' }}>
                            <div style={{ width: '64px', height: '64px', background: '#18181b', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                                <Trophy size={32} color="var(--text-secondary)" />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                                No rankings yet
                            </h3>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                                Be the first to duel and claim the #1 spot!
                            </p>
                            <Link href="/duel" className="btn-primary" style={{ display: 'inline-flex' }}>
                                <Swords size={20} strokeWidth={2.5} /> Start Dueling
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
