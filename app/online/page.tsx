'use client';

import { useState } from 'react';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Users, Sword, Wifi, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnlinePage() {
    const [handle, setHandle] = useState('');
    const [registered, setRegistered] = useState(false);

    // We only init hook when registered to avoid spamming connections
    const { onlineUsers, status, isHost, sendInvite, incomingInvite } = useLobbyRegistry(registered ? handle : '', 'ONLINE_PAGE');
    const router = useRouter();

    const joinLobby = () => {
        if (handle.trim()) setRegistered(true);
    };

    const challenge = (opp: string) => {
        router.push(`/duel?myHandle=${handle}&opponent=${opp}&autoChallenge=true`);
    };

    const handleInvite = (opp: string) => {
        // Send invite for them to join duel
        sendInvite(opp);
        // We go to duel page to wait for them (or we can wait here? Better to go to duel page)
        // But if they reject? 
        // Let's go to duel page, but maybe with a special param "waitingFor=opp"?
        // Simpler: Just go to duel page as if challenging.
        // But if we go to duel page, we leave ONLINE_PAGE registry.
        // Then when they accept, they go to duel page.
        // We meet there.
        // Wait, if I leave ONLINE_PAGE, I can't receive their accept?
        // Actually, they don't 'accept' back to registry. They 'accept' by going to URL provided.
        // So:
        // 1. I send Invite "Come to duel with me".
        // 2. I go to duel page.
        // 3. They see invite.
        // 4. They Click accept -> go to duel page.
        // 5. Duel Auto-Matchmaking picks up.
        router.push(`/duel?myHandle=${handle}&opponent=${opp}&autoChallenge=true`);
    };

    const acceptInvite = () => {
        if (incomingInvite) {
            router.push(`/duel?myHandle=${handle}&opponent=${incomingInvite.from}&autoChallenge=true`);
        }
    };

    if (!registered) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
                <div className="bg-gray-900/50 p-12 rounded-3xl border border-gray-800 text-center max-w-lg w-full">
                    <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-400">
                        <Users className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black mb-4">Online Lobby</h1>
                    <p className="text-gray-400 mb-8">See who's actively looking for a duel.</p>

                    <input
                        type="text"
                        placeholder="Your Handle"
                        value={handle}
                        onChange={e => setHandle(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-center text-lg mb-6 focus:border-green-500 outline-none transition-colors"
                    />

                    <button
                        onClick={joinLobby}
                        disabled={!handle}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-xl transition-all disabled:opacity-50"
                    >
                        Join List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 min-h-[90vh] relative">
            {/* Invite Modal */}
            {incomingInvite && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gray-900 border border-blue-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-blue-500/20">
                        <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                            <Sword className="text-blue-500" /> Duel Request!
                        </h3>
                        <p className="text-gray-300 mb-8 text-lg">
                            <span className="font-bold text-white bg-gray-800 px-2 py-1 rounded">{incomingInvite.from}</span> invites you to the arena.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={acceptInvite} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
                                Go to Arena
                            </button>
                            <button onClick={() => window.location.reload()} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                                Ignore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Users className="text-green-500" /> Online Players
                    </h1>
                    <p className="text-gray-400">
                        Status: <span className={`font-bold ${status === 'CONNECTED' || status === 'HOSTING' ? 'text-green-400' : 'text-yellow-500'}`}>{status}</span>
                        {isHost && <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">HOST NODE</span>}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{onlineUsers.length}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Active</p>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-4">
                {onlineUsers.filter(u => u.handle !== handle).map(user => {
                    const inLobby = user.location === 'DUEL_LOBBY';
                    const inGame = user.location === 'IN_GAME';
                    return (
                        <div key={user.handle} className={`bg-gray-900/40 border ${inLobby ? 'border-green-500/30' : inGame ? 'border-red-500/30' : 'border-gray-800'} p-6 rounded-2xl flex justify-between items-center group transition-colors`}>
                            <div>
                                <p className="font-bold text-xl text-white flex items-center gap-2">
                                    {user.handle}
                                    {!inLobby && !inGame && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30">BROWSING</span>}
                                    {inLobby && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded border border-green-500/30">LOBBY</span>}
                                    {inGame && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/30">BUSY</span>}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {inLobby ? 'Ready to duel' : inGame ? 'Currently in a match' : 'Browsing website'}
                                </p>
                            </div>
                            <button
                                onClick={() => inGame ? alert("User is busy!") : inLobby ? challenge(user.handle) : handleInvite(user.handle)}
                                disabled={inGame}
                                className={`p-3 rounded-xl transition-transform active:scale-95 ${inGame ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'}`}
                                title={inGame ? "User is busy" : inLobby ? "Challenge directly" : "Invite to Arena"}
                            >
                                <Sword className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}

                {onlineUsers.length <= 1 && (
                    <div className="col-span-2 text-center py-12 text-gray-500 bg-gray-900/20 rounded-2xl border border-dashed border-gray-800">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No other players online right now.</p>
                        <p className="text-sm">Wait for someone to join!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
