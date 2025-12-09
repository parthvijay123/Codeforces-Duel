'use client';

import { useUser } from '@/hooks/useUser';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import Link from 'next/link';
import { Users } from 'lucide-react';

export function Navbar() {
    const { user, loading } = useUser();

    const handleLogin = async () => {
        if (!auth) {
            alert("Firebase is not configured. Creating a guest session is not yet implemented.");
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
    };

    return (
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
                    <span className="text-sm text-gray-500">Loading...</span>
                ) : user ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-sm text-gray-300">
                            {user.displayName}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg text-sm transition font-medium"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {!auth && (
                            <span className="hidden sm:flex text-xs text-yellow-500 items-center bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                Guest Mode
                            </span>
                        )}
                        <button
                            onClick={handleLogin}
                            disabled={!auth}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition font-medium text-white shadow-lg shadow-blue-500/20"
                        >
                            {auth ? "Login with Google" : "Login Disabled"}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
