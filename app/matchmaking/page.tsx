'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Loader2, Globe, Search, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUser } from '@/hooks/useUser';

export default function MatchmakingPage() {
    return (
        <ProtectedRoute>
            <MatchmakingContent />
        </ProtectedRoute>
    );
}

function MatchmakingContent() {
    const { user } = useUser();
    const handle = user?.codeforcesHandle || '';

    const [active, setActive] = useState(false);
    const router = useRouter();

    const { status, startSearch, cleanup, queueCount } = useMatchmaking(handle, (opponent) => {
        router.push(`/duel?myHandle=${handle}&opponent=${opponent}&autoChallenge=true`);
    });

    useLobbyRegistry(status !== 'IDLE' ? handle : '', 'DUEL_LOBBY');

    const handleSearch = () => {
        if (handle) {
            setActive(true);
            startSearch();
        }
    };

    const cancel = () => {
        setActive(false);
        cleanup();
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '540px' }}>

                {!active ? (
                    <div>
                        {/* Header */}
                        <div style={{ marginBottom: '48px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'var(--accent-dim)',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                            }}>
                                <Globe size={32} color="var(--accent)" strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
                                Global Matchmaking
                            </h1>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                                Instantly matched against an opponent at your Codeforces skill level.
                            </p>
                        </div>

                        {/* Card */}
                        <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                            <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                Dueling as
                            </p>
                            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {handle || <span style={{ color: 'var(--text-muted)' }}>No handle set</span>}
                            </p>
                        </div>

                        <button
                            id="matchmaking-start"
                            onClick={handleSearch}
                            disabled={!handle}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                        >
                            <Search size={20} strokeWidth={2.5} />
                            Find Match
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Searching state */}
                        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                            {/* Spinner */}
                            <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 32px auto' }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    border: '3px solid var(--border-color)',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    border: '3px solid transparent',
                                    borderTopColor: 'var(--accent)',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    inset: '12px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Loader2 size={32} color="var(--text-secondary)" className="animate-spin" />
                                </div>
                            </div>

                            <h2 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
                                Searching…
                            </h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Looking for an opponent across the global network
                            </p>
                        </div>

                        <div className="card" style={{ padding: '32px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite', boxShadow: '0 0 10px var(--accent)' }} />
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', flex: 1, fontFamily: 'var(--font-inter)' }}>
                                Queue position: searching…
                            </span>
                            {queueCount > 0 && (
                                <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)' }}>{queueCount} in queue</span>
                            )}
                        </div>

                        <button
                            id="matchmaking-cancel"
                            onClick={cancel}
                            className="btn-ghost"
                            style={{ width: '100%', justifyContent: 'center', padding: '16px', color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                        >
                            <X size={20} strokeWidth={2.5} />
                            Cancel Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
