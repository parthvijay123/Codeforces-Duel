'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

            <nav className="flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-800">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Codeforces Duel
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/duel" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Start Duel
                        </Link>
                        <Link href="/matchmaking" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Matchmaking
                        </Link>
                        <Link href="/online" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            Online Players
                        </Link>
                        <Link href="/analysis" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                            <span className="text-yellow-500">★</span> My Stats
                        </Link>
                    </div>
                </div>

                <div>
                    {loading ? (
                        <div className="h-9 w-20 bg-gray-800 rounded animate-pulse"></div>
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm text-gray-200 font-medium">{user.username}</div>
                                {user.codeforcesHandle && (
                                    <div className="text-xs text-green-400">{user.codeforcesHandle}</div>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg text-sm transition font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="text-gray-300 hover:text-white font-medium text-sm px-3 py-2"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition font-medium text-white shadow-lg shadow-blue-500/20"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
}
