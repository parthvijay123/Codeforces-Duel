import { useState, useEffect } from 'react';
import { Trophy, XCircle, RefreshCw, ArrowRight, Minus } from 'lucide-react';
import { recordMatchResult, UserStats } from '@/lib/rating';
import { Problem } from '@/lib/codeforces';
import { useUser } from '@/hooks/useUser';

interface GameResultModalProps {
    result: 'WIN' | 'LOSS' | 'DRAW';
    opponent: string;
    opponentRating: number;
    problem: Problem;
    onClose: () => void;
}

export function GameResultModal({ result, opponent, opponentRating, problem, onClose }: GameResultModalProps) {
    const { user } = useUser();
    const handle = user?.codeforcesHandle || '';
    const [stats, setStats] = useState<UserStats | null>(null);
    const [ratingChange, setRatingChange] = useState<number>(0);

    useEffect(() => {
        const ratingProblem = {
            name: problem.name,
            rating: problem.rating || 0,
            tags: problem.tags,
            url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
            index: problem.index,
        };
        const newStats = recordMatchResult(handle, opponent, opponentRating, ratingProblem, result);
        setStats(newStats);
        setRatingChange(newStats.history[0].ratingChange);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!stats) return null;

    const isWin = result === 'WIN';
    const isDraw = result === 'DRAW';

    const accentColor = isWin ? 'var(--accent)' : isDraw ? 'var(--text-secondary)' : 'var(--danger)';
    const accentBg = isWin ? 'var(--accent-dim)' : isDraw ? 'var(--surface-raised)' : 'rgba(244, 63, 94, 0.1)';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />

            <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '48px' }}>

                {/* Result Icon */}
                <div style={{
                    width: '80px', height: '80px',
                    background: accentBg,
                    borderRadius: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '32px',
                }}>
                    {isWin
                        ? <Trophy size={40} color={accentColor} strokeWidth={2.5} />
                        : isDraw
                        ? <Minus size={40} color={accentColor} strokeWidth={2.5} />
                        : <XCircle size={40} color={accentColor} strokeWidth={2.5} />}
                </div>

                {/* Result text */}
                <h3 style={{
                    fontFamily: 'var(--font-jakarta), sans-serif',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: accentColor,
                    letterSpacing: '-0.03em',
                    margin: '0 0 16px 0',
                }}>
                    {isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
                </h3>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: '0 0 40px 0' }}>
                    {isWin
                        ? `You beat ${opponent}`
                        : isDraw
                        ? `Tied with ${opponent}`
                        : `${opponent} solved it first`}
                </p>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 32px 0' }} />

                {/* Rating change */}
                <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px 0' }}>
                        Rating Update
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                            {stats.rating}
                        </span>
                        <span style={{
                            fontFamily: 'var(--font-jakarta)',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            padding: '8px 16px',
                            borderRadius: '9999px',
                            background: ratingChange >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            color: ratingChange >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                            {ratingChange >= 0 ? '+' : ''}{ratingChange}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={onClose}
                        style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                    >
                        <RefreshCw size={20} strokeWidth={2.5} /> Play Again
                    </button>
                    <a
                        href="/analysis"
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', padding: '16px', textDecoration: 'none' }}
                    >
                        <ArrowRight size={20} strokeWidth={2.5} /> View Analysis
                    </a>
                </div>
            </div>
        </div>
    );
}
