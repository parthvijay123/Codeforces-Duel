'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { Users } from 'lucide-react';
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
            refreshUser(); // Update state
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

            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass-panel border-b-0 border-b-[var(--color-glass-border)]">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Logo className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                        <div className="flex flex-col leading-tight hidden sm:block">
                            <span className="text-sm font-black tracking-widest text-[#00E5FF]">CODEFORCES</span>
                            <span className="text-sm font-black tracking-widest text-[#FF4B4B]">DUEL</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/duel" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                            <span className="text-[#FF4B4B] group-hover:drop-shadow-[0_0_8px_#FF4B4B] transition-all">⚔</span>
                            Arena
                        </Link>
                        <Link href="/matchmaking" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                            <span className="text-[#FFD600] group-hover:drop-shadow-[0_0_8px_#FFD600] transition-all">🏆</span>
                            Matchmaking
                        </Link>
                        <Link href="/online" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                            <Users className="w-4 h-4 text-green-400 group-hover:drop-shadow-[0_0_8px_#4ade80] transition-all" />
                            Players
                        </Link>
                        <Link href="/analysis" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                            <span className="text-purple-400 group-hover:drop-shadow-[0_0_8px_#c084fc] transition-all">❖</span>
                            Dashboard
                        </Link>
                    </div>
                </div>

                <div>
                    {loading ? (
                        <div className="h-10 w-24 bg-gray-800 rounded-full animate-pulse"></div>
                    ) : user ? (
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm text-white font-bold">{user.username}</div>
                                {user.codeforcesHandle && (
                                    <div className="text-xs text-green-400 font-mono tracking-wide">{user.codeforcesHandle}</div>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2 rounded-full text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-gray-300 hover:text-white font-bold text-sm px-4 py-2 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
}
