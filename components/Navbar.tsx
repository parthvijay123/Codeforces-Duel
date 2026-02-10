'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { Swords, BarChart2, Users, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import HandleVerificationModal from './HandleVerificationModal';
import { useState, useEffect } from 'react';

export function Navbar() {
    const { user, loading, refreshUser } = useUser();
    const router = useRouter();
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    useEffect(() => {
        if (!loading && user && (!user.isVerified || !user.codeforcesHandle)) {
            setShowVerificationModal(true);
        } else {
            setShowVerificationModal(false);
        }
    }, [user, loading]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            refreshUser();
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        refreshUser();
    };

    return (
        <>
            <HandleVerificationModal
                isOpen={showVerificationModal}
                onSuccess={handleVerificationSuccess}
            />

            <nav
                style={{
                    background: 'rgba(5, 5, 5, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Left: Logo + Nav links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
                            <Logo className="w-10 h-10" />
                            <span style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                CF<span style={{ color: '#ccff00' }}>Duel</span>
                            </span>
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden md:flex">
                            {[
                                { href: '/duel', label: 'Arena', icon: <Swords size={18} /> },
                                { href: '/matchmaking', label: 'Matchmaking', icon: <Globe size={18} /> },
                                { href: '/online', label: 'Players', icon: <Users size={18} /> },
                                { href: '/analysis', label: 'Dashboard', icon: <BarChart2 size={18} /> },
                            ].map(({ href, label, icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '9999px',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-jakarta), sans-serif',
                                        color: '#a1a1aa',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    {icon}
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right: Auth */}
                    <div>
                        {loading ? (
                            <div style={{ width: '100px', height: '44px', background: '#18181b', borderRadius: '9999px', animation: 'pulse 1.5s infinite' }} />
                        ) : user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div className="hidden sm:block" style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.username}</div>
                                    {user.codeforcesHandle && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>{user.codeforcesHandle}</div>
                                    )}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn-ghost"
                                    style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Link
                                    href="/login"
                                    style={{
                                        fontFamily: 'var(--font-jakarta), sans-serif',
                                        padding: '10px 20px',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: '#a1a1aa',
                                        textDecoration: 'none',
                                        borderRadius: '9999px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="btn-primary"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
