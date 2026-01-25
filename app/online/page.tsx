'use client';

import { useState } from 'react';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { Users, Sword, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute'; // Authenticated users only
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

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-[90vh] relative mt-10">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Invite Modal */}
            {incomingInvite && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in">
                    <div className="glass-panel p-10 rounded-[2rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                            <Sword className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 text-white">
                            Duel Request!
                        </h3>
                        <p className="text-gray-300 mb-8 text-lg font-medium leading-relaxed">
                            <span className="font-bold text-[#00E5FF]">{incomingInvite.from}</span> invites you to the arena.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={acceptInvite} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02]">
                                Accept
                            </button>
                            <button onClick={() => window.location.reload()} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02]">
                                Ignore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 z-10 relative">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-3 flex items-center gap-4 text-white tracking-tight">
                        <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
                            <Users className="text-green-400 w-8 h-8" />
                        </div>
                        Online Players
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <p className="text-gray-400 font-medium bg-black/40 px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Server: <span className={`font-bold ${status === 'CONNECTED' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
                        </p>
                        <p className="text-sm text-gray-500 font-medium">Logged in as <span className="text-white font-bold tracking-wide">{handle}</span></p>
                    </div>
                </div>
                <div className="text-left md:text-right mt-6 md:mt-0 bg-black/40 px-6 py-4 rounded-2xl border border-white/5">
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{onlineUsers.length}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">Active</p>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                {onlineUsers.filter(u => u.handle !== handle).map(user => {
                    const inLobby = user.location === 'DUEL_LOBBY';
                    const inGame = user.location === 'IN_GAME';
                    return (
                        <div key={user.handle} className={`glass-panel p-6 rounded-2xl flex justify-between items-center group transition-all hover:-translate-y-1 ${inLobby ? 'hover:border-green-500/50' : inGame ? 'hover:border-red-500/50' : 'hover:border-white/20'}`}>
                            <div>
                                <p className="font-bold text-xl text-white flex items-center gap-3 mb-1">
                                    {user.handle}
                                    {!inLobby && !inGame && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30 uppercase tracking-widest font-black">Browsing</span>}
                                    {inLobby && <span className="text-[9px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/30 uppercase tracking-widest font-black">In Lobby</span>}
                                    {inGame && <span className="text-[9px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full border border-red-500/30 uppercase tracking-widest font-black">Busy</span>}
                                </p>
                                <p className="text-sm font-medium text-gray-500">
                                    {inLobby ? 'Ready to duel in lobby' : inGame ? 'Currently playing a match' : 'Browsing the website'}
                                </p>
                            </div>
                            <button
                                onClick={() => inGame ? alert("User is busy!") : inLobby ? challenge(user.handle) : handleInvite(user.handle)}
                                disabled={inGame}
                                className={`p-4 rounded-xl transition-all ${inGame ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:scale-105 active:scale-95'}`}
                                title={inGame ? "User is busy" : inLobby ? "Challenge directly" : "Invite to Arena"}
                            >
                                <Sword className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}

                {onlineUsers.length <= 1 && (
                    <div className="col-span-1 md:col-span-2 text-center py-20 px-8 glass-panel rounded-[2rem] border-dashed">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-gray-500 opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">It's quiet here...</h3>
                        <p className="text-gray-400 font-medium">No other players are currently online. Wait for someone to join the arena!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
