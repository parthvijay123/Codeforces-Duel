'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Loader2, Globe, Users } from 'lucide-react';

export default function MatchmakingPage() {
    const [handle, setHandle] = useState('');
    const [active, setActive] = useState(false);
    const router = useRouter();

    const { status, startSearch, cleanup, queueCount } = useMatchmaking(handle, (opponent) => {
        // Match found!
        // We need to pass this opp to the Duel Page.
        // Simplest way: URL params?
        router.push(`/duel?myHandle=${handle}&opponent=${opponent}&autoChallenge=true`);
    });

    // Make visible in Online List
    useLobbyRegistry(status !== 'IDLE' ? handle : '', 'DUEL_LOBBY');

    const handleSearch = () => {
        if (handle.trim()) {
            setActive(true);
            startSearch();
        }
    }

    const cancel = () => {
        setActive(false);
        cleanup();
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] p-8">
            {!active ? (
                <div className="bg-gray-900/50 p-12 rounded-3xl border border-gray-800 text-center max-w-lg w-full">
                    <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 text-blue-400">
                        <Globe className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black mb-4">Global Matchmaking</h1>
                    <p className="text-gray-400 mb-8">Find a worthy opponent instantly.</p>

                    <input
                        type="text"
                        placeholder="Enter your Handle"
                        value={handle}
                        onChange={e => setHandle(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-center text-lg mb-6 focus:border-blue-500 outline-none transition-colors"
                    />

                    <button
                        onClick={handleSearch}
                        disabled={!handle}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-xl transition-all disabled:opacity-50"
                    >
                        Find Match
                    </button>
                </div>
            ) : (
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="relative mx-auto w-32 h-32 mb-8">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mb-2">Searching for Opponent...</h2>
                    <p className="text-gray-400 mb-8">
                        {status === 'HOSTING' ? `Hosting Match Node (Queue: ${queueCount})` : 'Scanning Network...'}
                    </p>

                    <button
                        onClick={cancel}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-8 py-3 rounded-full font-medium transition-colors"
                    >
                        Cancel Search
                    </button>
                </div>
            )}
        </div>
    );
}
