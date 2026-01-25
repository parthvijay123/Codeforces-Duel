'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Loader2, Globe } from 'lucide-react';
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
        // Match found!
        router.push(`/duel?myHandle=${handle}&opponent=${opponent}&autoChallenge=true`);
    });

    // Make visible in Online List
    useLobbyRegistry(status !== 'IDLE' ? handle : '', 'DUEL_LOBBY');

    const handleSearch = () => {
        if (handle) {
            setActive(true);
            startSearch();
        }
    }

    const cancel = () => {
        setActive(false);
        cleanup();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] p-8 relative">
            {/* Background Orbs */}
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

            {!active ? (
                <div className="glass-panel p-16 rounded-[2.5rem] text-center max-w-xl w-full shadow-2xl relative z-10 transition-all hover:-translate-y-2 hover:shadow-blue-500/10">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-8 text-blue-400 border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Globe className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight">Global Matchmaking</h1>
                    <p className="text-gray-400 mb-10 text-lg font-medium">Find a worthy opponent instantly within the network.</p>

                    <div className="bg-black/30 p-6 rounded-2xl mb-8 border border-white/5">
                        <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Dueling as</p>
                        <p className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">{handle}</p>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!handle}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-5 rounded-2xl text-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-95"
                    >
                        Find Match
                    </button>
                </div>
            ) : (
                <div className="glass-panel p-16 rounded-[2.5rem] text-center max-w-xl w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="relative mx-auto w-40 h-40 mb-10">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping delay-75"></div>
                        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full m-2">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                    </div>

                    <h2 className="text-4xl font-black mb-3 text-white">Scanning...</h2>
                    <p className="text-blue-400 mb-10 text-lg font-medium animate-pulse">
                        Searching the global network for an opponent
                    </p>

                    <button
                        onClick={cancel}
                        className="bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 text-gray-400 px-10 py-5 rounded-2xl font-bold transition-all w-full text-lg shadow-lg hover:shadow-red-500/20"
                    >
                        Cancel Search
                    </button>
                </div>
            )}
        </div>
    );
}
