'use client';

import { useState } from 'react';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Users, Swords, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUser } from '@/hooks/useUser';

export default function OnlinePage() {
    return (
        <ProtectedRoute>
            <OnlineContent />
        </ProtectedRoute>
    );
}

function OnlineContent() {
    const { user } = useUser();
    const handle = user?.codeforcesHandle || '';
    const router = useRouter();

    const { onlineUsers, status, sendInvite, incomingInvite } = useLobbyRegistry(handle, 'ONLINE_PAGE');

    const challenge = (opp: string) => {
        router.push(`/duel?myHandle=${handle}&opponent=${opp}&autoChallenge=true`);
    };

    const handleInvite = (opp: string) => {
        sendInvite(opp);
        router.push(`/duel?myHandle=${handle}&opponent=${opp}&autoChallenge=true`);
    };

    const acceptInvite = () => {
        if (incomingInvite) {
            router.push(`/duel?myHandle=${handle}&opponent=${incomingInvite.from}&autoChallenge=true`);
        }
    };

    const uniqueHandles = Array.from(new Set(onlineUsers.map(u => u.handle)));
    const others = onlineUsers.filter(u => u.handle !== handle);
    
    // Deduplicate others by handle so we don't show the same opponent multiple times
    const uniqueOthers = others.filter((u, index, self) =>
        index === self.findIndex((t) => t.handle === u.handle)
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px' }}>

            {/* Invite Modal */}
            {incomingInvite && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: '32px',
                    backdropFilter: 'blur(8px)',
                }}>
                    <div className="card" style={{ padding: '48px', maxWidth: '440px', width: '100%' }}>
                        <div style={{ width: '64px', height: '64px', background: 'var(--accent-dim)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Swords size={32} color="var(--accent)" strokeWidth={2.5} />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
                            Duel Request
                        </h3>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{incomingInvite.from}</span> invites you to the arena.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={acceptInvite} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>
                                Accept
                            </button>
                            <button onClick={() => window.location.reload()} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>
                                Ignore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
                        Active Players
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} />
                            Server: <span style={{ color: status === 'CONNECTED' ? 'var(--success)' : 'var(--accent)', fontWeight: 700 }}>{status}</span>
                        </span>
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                            Signed in as <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{handle}</span>
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                        {Math.max(1, uniqueHandles.length)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px' }}>Active</div>
                </div>
            </div>

            {/* Player List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {uniqueOthers.map(u => {
                    const inLobby = u.location === 'DUEL_LOBBY';
                    const inGame = u.location === 'IN_GAME';
                    return (
                        <div
                            key={u.handle}
                            className="card"
                            style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
                                    background: inGame ? 'var(--danger)' : inLobby ? 'var(--success)' : 'var(--text-muted)',
                                    boxShadow: inGame ? '0 0 10px var(--danger)' : inLobby ? '0 0 10px var(--success)' : 'none'
                                }} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{u.handle}</span>
                                        {inLobby && <span className="badge badge-green">In Lobby</span>}
                                        {inGame && <span className="badge badge-red">Busy</span>}
                                        {!inLobby && !inGame && <span className="badge badge-gray">Browsing</span>}
                                    </div>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                        {inLobby ? 'Ready to duel in lobby' : inGame ? 'Currently in a match' : 'Browsing the site'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => inGame ? alert("User is busy!") : inLobby ? challenge(u.handle) : handleInvite(u.handle)}
                                disabled={inGame}
                                className={inGame ? 'btn-ghost' : 'btn-primary'}
                                style={{ flexShrink: 0, padding: '12px 24px', fontSize: '1rem' }}
                                title={inGame ? "User is in a match" : inLobby ? "Challenge directly" : "Invite to arena"}
                            >
                                <Swords size={18} strokeWidth={2.5} />
                                {inGame ? 'Busy' : inLobby ? 'Challenge' : 'Invite'}
                            </button>
                        </div>
                    );
                })}

                {uniqueOthers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '96px 32px', border: '2px dashed var(--border-color)', borderRadius: '2rem' }}>
                        <div style={{ width: '64px', height: '64px', background: '#18181b', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <Users size={32} color="var(--text-secondary)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                            No players online
                        </h3>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Wait for others to join, or try ranked matchmaking.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
