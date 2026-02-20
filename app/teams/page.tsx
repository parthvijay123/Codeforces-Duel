'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Copy, Check, ArrowRight, Trash2, Loader2, Shield, Swords, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import ProtectedRoute from '@/components/ProtectedRoute';

interface TeamMember {
    username: string;
    codeforcesHandle: string;
}

interface Team {
    id: string;
    name: string;
    inviteCode: string;
    captain: TeamMember;
    members: TeamMember[];
    memberCount: number;
    createdAt: string;
}

interface TeamMatch {
    id: string;
    opponentTeamName: string;
    problem: { name: string; rating: number; tags: string[]; index: string; contestId: number };
    result: 'WIN' | 'LOSS' | 'DRAW';
    members: string[];
    createdAt: string;
}

export default function TeamsPage() {
    return (
        <ProtectedRoute>
            <TeamsContent />
        </ProtectedRoute>
    );
}

function TeamsContent() {
    const { user } = useUser();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);

    // Create form
    const [teamName, setTeamName] = useState('');
    const [creating, setCreating] = useState(false);

    // Join form
    const [inviteCode, setInviteCode] = useState('');
    const [joining, setJoining] = useState(false);

    const [copied, setCopied] = useState<string | null>(null);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teams');
            const data = await res.json();
            setTeams(data.teams || []);
        } catch (e) {
            console.error('Failed to fetch teams:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleCreate = async () => {
        if (!teamName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: teamName.trim() }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setShowCreate(false);
            setTeamName('');
            fetchTeams();
        } catch (e: any) {
            alert(e.message || 'Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) return;
        setJoining(true);
        try {
            const res = await fetch('/api/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: inviteCode.trim() }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setShowJoin(false);
            setInviteCode('');
            fetchTeams();
        } catch (e: any) {
            alert(e.message || 'Failed to join team');
        } finally {
            setJoining(false);
        }
    };

    const handleDelete = async (teamId: string) => {
        if (!confirm('Are you sure you want to disband this team?')) return;
        try {
            const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSelectedTeam(null);
            fetchTeams();
        } catch (e: any) {
            alert(e.message || 'Failed to disband team');
        }
    };

    const viewTeamDetail = async (team: Team) => {
        setSelectedTeam(team);
        setLoadingMatches(true);
        try {
            const res = await fetch(`/api/teams/${team.id}`);
            const data = await res.json();
            setTeamMatches(data.matches || []);
        } catch (e) {
            console.error('Failed to fetch team detail:', e);
        } finally {
            setLoadingMatches(false);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    const isCaptain = (team: Team) => team.captain.codeforcesHandle === user?.codeforcesHandle || team.captain.username === user?.username;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 32px', width: '100%' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '9999px', padding: '8px 20px', marginBottom: '24px',
                    }}>
                        <Shield size={16} color="#a855f7" strokeWidth={2.5} />
                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Squads
                        </span>
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>
                        Your Teams
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                        Create squads of 3, battle together with real-time collaborative editing.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={() => setShowJoin(true)} className="btn-ghost" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                        <Users size={18} strokeWidth={2.5} /> Join Team
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                        <Plus size={18} strokeWidth={2.5} /> Create Team
                    </button>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCreate(false)} />
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '48px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Shield size={32} color="#a855f7" strokeWidth={2.5} />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                            Create Team
                        </h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            Name your squad. You'll get an invite code to share.
                        </p>
                        <input
                            type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                            className="form-input" placeholder="Team name" style={{ marginBottom: '24px' }}
                            maxLength={30} autoFocus
                        />
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>Cancel</button>
                            <button onClick={handleCreate} disabled={!teamName.trim() || creating} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>
                                {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
                                {creating ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoin && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowJoin(false)} />
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '440px', padding: '48px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <Users size={32} color="#a855f7" strokeWidth={2.5} />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                            Join Team
                        </h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                            Enter the 6-character invite code from your captain.
                        </p>
                        <input
                            type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            className="form-input" placeholder="e.g. X7K9P2" style={{ marginBottom: '24px', fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '0.2em', textAlign: 'center' }}
                            maxLength={6} autoFocus
                        />
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setShowJoin(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>Cancel</button>
                            <button onClick={handleJoin} disabled={inviteCode.length < 6 || joining} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '16px' }}>
                                {joining ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={2.5} />}
                                {joining ? 'Joining…' : 'Join'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Detail Modal */}
            {selectedTeam && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', overflow: 'auto' }}>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedTeam(null)} />
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '48px', maxHeight: '90vh', overflow: 'auto' }}>
                        <button onClick={() => setSelectedTeam(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                            {selectedTeam.name}
                        </h3>

                        {/* Invite Code */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', marginTop: '16px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.2em', fontWeight: 800, color: '#a855f7', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '8px 16px', borderRadius: '0.75rem' }}>
                                {selectedTeam.inviteCode}
                            </div>
                            <button onClick={() => copyCode(selectedTeam.inviteCode)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '10px', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                                {copied === selectedTeam.inviteCode ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                            </button>
                        </div>

                        {/* Members */}
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                            Members ({selectedTeam.members.length}/3)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                            {selectedTeam.members.map((m, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface-raised)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ['#ccff00', '#f43f5e', '#f97316'][i] }} />
                                    <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{m.codeforcesHandle || m.username}</span>
                                    {m.codeforcesHandle === selectedTeam.captain.codeforcesHandle && (
                                        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Captain</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                            <Link href={`/duel?teamId=${selectedTeam.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px', textDecoration: 'none' }}>
                                <Swords size={18} strokeWidth={2.5} /> Start Team Duel
                            </Link>
                            {isCaptain(selectedTeam) && (
                                <button onClick={() => handleDelete(selectedTeam.id)} className="btn-ghost" style={{ padding: '14px', color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Match History */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                            <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                Battle History
                            </p>
                            {loadingMatches ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : teamMatches.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>No battles yet. Start a team duel!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {teamMatches.map(match => (
                                        <div key={match.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', background: 'var(--surface-raised)', borderRadius: '1rem',
                                            border: '1px solid var(--border-color)',
                                        }}>
                                            <div>
                                                <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                                    vs {match.opponentTeamName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {match.problem.name} • {match.problem.rating}
                                                </div>
                                            </div>
                                            <span className={`badge ${match.result === 'WIN' ? 'badge-green' : match.result === 'LOSS' ? 'badge-red' : 'badge-gray'}`}>
                                                {match.result}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '96px 0', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.1rem', fontWeight: 600 }}>Loading teams…</span>
                </div>
            )}

            {/* Teams Grid */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {teams.map(team => (
                        <div
                            key={team.id}
                            className="card"
                            style={{ padding: '32px', cursor: 'pointer' }}
                            onClick={() => viewTeamDetail(team)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={24} color="#a855f7" strokeWidth={2.5} />
                                </div>
                                <span className="badge badge-purple">{team.memberCount}/3</span>
                            </div>

                            <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                                {team.name}
                            </h3>

                            {/* Members list */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {team.members.map((m, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 10px', background: 'var(--surface-raised)',
                                        borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ['#ccff00', '#f43f5e', '#f97316'][i] }} />
                                        {m.codeforcesHandle || m.username}
                                    </div>
                                ))}
                            </div>

                            {/* Invite code */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#a855f7',
                                    letterSpacing: '0.15em', background: 'rgba(168, 85, 247, 0.06)',
                                    padding: '4px 10px', borderRadius: '0.5rem',
                                }}>
                                    {team.inviteCode}
                                </div>
                                <ChevronRight size={18} color="var(--text-muted)" />
                            </div>
                        </div>
                    ))}

                    {/* Empty state */}
                    {teams.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '96px 32px', border: '2px dashed var(--border-color)', borderRadius: '2rem' }}>
                            <div style={{ width: '64px', height: '64px', background: '#18181b', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                                <Users size={32} color="var(--text-secondary)" />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                                No teams yet
                            </h3>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
                                Create a squad of 3 and battle together with real-time collaborative editing.
                            </p>
                            <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
                                <Plus size={20} strokeWidth={2.5} /> Create Your First Team
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
