'use client';

import { useState, useEffect } from 'react';
import { useDuel } from '@/hooks/useDuel';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { getRandomProblem, checkSubmission } from '@/lib/codeforces';
import { ExternalLink, CheckCircle, XCircle, Play, Loader2, Users, Sword, LogOut } from 'lucide-react';
import { GameResultModal } from '@/components/GameResultModal';
import { recordMatchResult } from '@/lib/rating';
import { CodeEditor } from '@/components/CodeEditor';
import ProtectedRoute from '@/components/ProtectedRoute'; // Authenticated users only
import { useUser } from '@/hooks/useUser';

export default function DuelPage() {
    return (
        <ProtectedRoute>
            <DuelContent />
        </ProtectedRoute>
    );
}

function DuelContent() {
    const { user } = useUser();
    const myHandle = user?.codeforcesHandle || '';

    // We assume user is registered if they have a handle from auth
    // But hooks shouldn't be conditional.
    // useDuel expects a handle. If empty initially (loading), it might be weird.
    // However, ProtectedRoute ensures 'user' is present.
    // But 'user.codeforcesHandle' might be missing if they bypassed verification?
    // The Navbar forces verification. So we can assume it's there or user is stuck.

    const [registered, setRegistered] = useState(true); // Auto-registered by auth

    // Stage 2: Lobby
    const {
        state,
        opponent,
        incomingChallenge,
        problem,
        opponentStatus,
        opponentRating,
        challengeUser,
        acceptChallenge,
        rejectChallenge,
        startMatch,
        sendUpdate,
        reset,
        isPeerReady,
        matchParams,
        proposeRating,
        acceptProposal,
        rejectProposal,
        problemQueue,
        currentProblemIndex,
        pendingProblem,
        proposeProblem,
        acceptProblem,
        rejectProblem,
        nextProblem,
        myScore,
        opponentScore,
        setMyScore,
        // Team Props
        teamMembers,
        mode,
        setMode,
        isCaptain,
        setIsCaptain,
        joinTeam
    } = useDuel(myHandle);

    const { onlineUsers } = useLobbyRegistry(
        myHandle,
        state === 'IN_GAME' ? 'IN_GAME' : 'DUEL_LOBBY',
        isCaptain,
        teamMembers.length + 1
    );

    const [targetHandle, setTargetHandle] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const autoOpp = params.get('opponent');
            if (autoOpp) setTargetHandle(autoOpp);
        }
    }, []);

    // Game State
    const [rating, setRating] = useState(800);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<'idle' | 'solved' | 'failed'>('idle');

    // IDE State
    const [code, setCode] = useState('// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int t; cin >> t;\n    while(t--) {\n        \n    }\n    return 0;\n}');
    const [problemHtml, setProblemHtml] = useState<string>('');
    const [fetchingProblem, setFetchingProblem] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Problem Content when problem changes
    useEffect(() => {
        if (!problem) return;

        const fetchContent = async () => {
            setFetchingProblem(true);
            setError(null);
            try {
                const res = await fetch(`/api/codeforces/problem?contestId=${problem.contestId}&index=${problem.index}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (data.html) setProblemHtml(data.html);
            } catch (e: any) {
                console.error("Failed to fetch problem content", e);
                setError(e.message || "Failed to load problem.");
            } finally {
                setFetchingProblem(false);
            }
        };

        fetchContent();
        setCode('// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Problem: ' + (problem.name || 'Unknown') + '\n    int t; cin >> t;\n    while(t--) {\n        \n    }\n    return 0;\n}');
    }, [problem]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const autoOpponent = params.get('opponent');
            if (autoOpponent) {
                setTargetHandle(autoOpponent);
            }
        }
    }, [challengeUser]);

    // Auto-challenge logic
    useEffect(() => {
        if (isPeerReady && targetHandle) {
            const params = new URLSearchParams(window.location.search);
            const autoChallenge = params.get('autoChallenge');
            if (autoChallenge === 'true') {
                if (state !== 'CHALLENGING' && state !== 'WAITING' && state !== 'IN_GAME') {
                    console.log("Auto-challenging:", targetHandle);
                    challengeUser(targetHandle);
                }
            }
        }
    }, [isPeerReady, targetHandle, state, challengeUser]); // Added challengeUser to deps


    const findAndStart = async () => {
        setLoading(true);
        const prob = await getRandomProblem(rating);
        if (prob) {
            startMatch(prob);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (status !== 'idle') {
            sendUpdate(status);
        }
    }, [status, sendUpdate]); // Added sendUpdate

    const verify = async () => {
        if (!problem || !myHandle) return;
        setChecking(true);
        const solved = await checkSubmission(myHandle, problem.contestId, problem.index);
        setStatus(solved ? 'solved' : 'failed');
        if (solved) {
            setMyScore(prev => prev + 1);
        }
        setChecking(false);
    };

    const handleForfeit = () => {
        if (state === 'IN_GAME' && problem && opponent) {
            const ratingProblem = {
                name: problem.name,
                rating: problem.rating || 0,
                tags: problem.tags,
                url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                index: problem.index
            };
            recordMatchResult(opponent, opponentRating, ratingProblem, 'LOSS');
        }
        reset();
    };


    // RENDER LOGIC

    // 1. INCOMING CHALLENGE MODAL
    if (incomingChallenge) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-gray-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 duration-200">
                    <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                        <Sword className="text-purple-500" /> Challenge Received!
                    </h3>
                    <p className="text-gray-300 mb-8 text-lg">
                        <span className="font-bold text-white bg-gray-800 px-2 py-1 rounded">{incomingChallenge}</span> wants to duel you.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={acceptChallenge} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all">
                            Accept Duel
                        </button>
                        <button onClick={rejectChallenge} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-all">
                            Run Away
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. GAME ROOM
    if (state === 'IN_GAME' && problem) {
        // ... (Same Game Room UI as before, just verify variables are in scope)
        // I will just copy the Game Room UI block effectively, but I need to make sure I don't miss anything.
        // For brevity in this full file overwrite, I'll paste the Game Room UI.
        return (
            <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#0d1117]">
                <div className="h-14 shrink-0 border-b border-gray-800 bg-[#161b22] px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-200">{problem.contestId}{problem.index} - {problem.name}</span>
                        <span className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-400">{problem.rating}</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="flex gap-4 text-sm font-mono">
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-blue-400 font-bold">{myScore}</span>
                                <span className="text-[10px] text-gray-500">YOU</span>
                            </div>
                            <div className="text-gray-600">:</div>
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-red-400 font-bold">{opponentScore}</span>
                                <span className="text-[10px] text-gray-500">OPP</span>
                            </div>
                        </div>
                        <button onClick={handleForfeit} className="text-gray-500 hover:text-red-400 p-1 rounded" title="Forfeit">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/2 border-r border-gray-800 flex flex-col bg-[#0d1117] overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {fetchingProblem ? (
                                <div className="flex justify-center items-center h-full text-gray-500 gap-2">
                                    <Loader2 className="animate-spin w-5 h-5" /> Loading Problem...
                                </div>
                            ) : problemHtml ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: problemHtml }} />
                                    <style jsx global>{`
                                         .problem-statement { color: #c9d1d9; }
                                         .problem-statement .header { margin-bottom: 20px; }
                                         .problem-statement .title { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; }
                                         .problem-statement .time-limit, .problem-statement .memory-limit, .problem-statement .input-file, .problem-statement .output-file { font-size: 0.8em; color: #8b949e; }
                                         .problem-statement p { margin-bottom: 1em; line-height: 1.6; }
                                         .problem-statement .input-specification, .problem-statement .output-specification, .problem-statement .sample-tests, .problem-statement .note { margin-top: 1.5em; }
                                         .problem-statement .section-title { font-weight: bold; font-size: 1.1em; marginBottom: 0.5em; color: #58a6ff; }
                                         .sample-test .input, .sample-test .output { border: 1px solid #30363d; background: #161b22; margin-bottom: 10px; }
                                         .sample-test pre { padding: 10px; margin: 0; font-family: monospace; white-space: pre-wrap; }
                                         .tex-font-style-tt { font-family: monospace; background: #21262d; padding: 2px 4px; rounded: 4px; }
                                         .MathJax_Preview { color: #8b949e; }
                                     `}</style>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                                    <p className="mb-2 text-red-400 font-bold">Could not load problem statement.</p>
                                    <p className="text-xs text-gray-600 mb-4 font-mono">{error || "Unknown Error"}</p>
                                    <a
                                        href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                                        target="_blank"
                                        className="text-blue-400 hover:underline flex items-center gap-1 bg-gray-800 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700"
                                    >
                                        Open in Codeforces <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
                        <div className="flex-1 overflow-hidden">
                            <CodeEditor value={code} onChange={(val) => setCode(val || '')} />
                        </div>
                        <div className="h-16 px-6 border-t border-gray-700 bg-[#252526] flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                                {status === 'solved' ? (
                                    <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Solved</span>
                                ) : status === 'failed' ? (
                                    <span className="text-red-400 font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>
                                ) : "Ready to submit"}
                            </div>
                            <div className="flex gap-3">
                                <a
                                    href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" /> Open CF
                                </a>
                                <button
                                    onClick={verify}
                                    disabled={checking || status === 'solved'}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Verify Submission
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {(status === 'solved' || opponentStatus === 'solved' || opponentStatus === 'left') && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        {(currentProblemIndex >= problemQueue.length - 1 || problemQueue.length === 0 || opponentStatus === 'left') ? (
                            <GameResultModal
                                result={opponentStatus === 'left' ? 'WIN' : myScore > opponentScore ? 'WIN' : myScore < opponentScore ? 'LOSS' : 'DRAW'}
                                opponent={opponent || 'Unknown'}
                                opponentRating={opponentRating}
                                problem={problem}
                                onClose={reset}
                            />
                        ) : (
                            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center">
                                <h3 className={`text-3xl font-bold mb-4 ${status === 'solved' ? 'text-green-500' : 'text-red-500'}`}>
                                    {status === 'solved' ? 'Round Won!' : 'Round Lost'}
                                </h3>
                                <p className="text-gray-400 mb-8">
                                    {status === 'solved' ? 'Great job! Get ready for the next one.' : 'Opponent solved it first.'}
                                </p>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        nextProblem();
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5 fill-current" /> Next Problem ({currentProblemIndex + 2}/{problemQueue.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 3. LOBBY DASHBOARD
    return (
        <div className="max-w-4xl mx-auto p-8 w-full">
            <header className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2">Duel Lobby</h1>
                    <p className="text-gray-400">Connected as <span className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">{myHandle || 'Unknown'}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        {isPeerReady ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500 animate-pulse"></span>
                        )}
                    </span>
                    <span className={`text-sm font-medium ${isPeerReady ? 'text-green-400' : 'text-yellow-500'}`}>
                        {isPeerReady ? 'Online' : 'Connecting to Server...'}
                    </span>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Challenge / Team Card */}
                <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                    <div className="flex gap-4 mb-6">
                        <button onClick={() => setMode('SOLO')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'SOLO' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Solo Duel</button>
                        <button onClick={() => setMode('TEAM')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'TEAM' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Team Duel</button>
                    </div>

                    {mode === 'SOLO' ? (
                        <>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                                <Sword className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Challenge Player</h2>
                            <p className="text-gray-400 mb-6 text-sm">Enter their exact Codeforces handle. They must be on this page right now.</p>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={targetHandle}
                                    onChange={(e) => setTargetHandle(e.target.value)}
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Opponent's Handle"
                                />
                                <button
                                    onClick={() => challengeUser(targetHandle)}
                                    disabled={!targetHandle || state === 'CHALLENGING' || !isPeerReady}
                                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {state === 'CHALLENGING' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sword className="w-5 h-5" />}
                                    {state === 'CHALLENGING' ? 'Sending Challenge...' : 'Send Challenge'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-purple-400" /> Team Lobby
                            </h2>
                            {!isCaptain && teamMembers.length === 0 && !opponent && state === 'LOBBY' && (
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setIsCaptain(true)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl text-left transition-all group">
                                            <p className="font-bold text-white group-hover:text-purple-400">Create Team</p>
                                            <p className="text-xs text-gray-500 mt-1">Be the Captain</p>
                                        </button>
                                        <button onClick={() => setIsCaptain(false)} className="p-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl text-left transition-all group">
                                            <p className="font-bold text-white group-hover:text-purple-400">Join Team</p>
                                            <p className="text-xs text-gray-500 mt-1">Enter Captain's ID</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {isCaptain && (
                                <div className="space-y-6">
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                        <p className="text-xs text-purple-300 uppercase font-bold mb-1">Your Team Code</p>
                                        <p className="text-2xl font-mono text-white tracking-widest">{myHandle}</p>
                                        <p className="text-xs text-gray-400 mt-2">Share this handle with your friends to join.</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 mb-2">Team Members ({teamMembers.length})</p>
                                        <div className="space-y-2">
                                            {teamMembers.length === 0 ? (
                                                <p className="text-sm text-gray-600 italic">No members yet. Waiting for joiners...</p>
                                            ) : (
                                                teamMembers.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-gray-800/50 p-2 px-3 rounded text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        <span className="text-white">{m.handle}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-800 pt-6 mt-6">
                                        <p className="text-sm font-bold text-gray-300 mb-4">Challenge Opposing Captain</p>
                                        <div className="mb-6">
                                            <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">Ready Teams</p>
                                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                {onlineUsers.filter(u => u.isCaptain && u.handle !== myHandle).length === 0 ? (
                                                    <p className="text-xs text-gray-600 italic">No other teams online.</p>
                                                ) : (
                                                    onlineUsers.filter(u => u.isCaptain && u.handle !== myHandle).map(team => (
                                                        <div key={team.handle} className="flex justify-between items-center bg-gray-800/60 p-3 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
                                                            <div>
                                                                <p className="text-white font-bold">{team.handle}</p>
                                                                <p className="text-xs text-gray-400">Team Size: {team.teamSize || 1}</p>
                                                            </div>
                                                            <button onClick={() => setTargetHandle(team.handle)} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors">Select</button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <input type="text" value={targetHandle} onChange={(e) => setTargetHandle(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Opponent Captain's Handle" />
                                            <button onClick={() => challengeUser(targetHandle)} disabled={!targetHandle || state === 'CHALLENGING' || !isPeerReady} className="w-full bg-purple-600 text-white hover:bg-purple-500 font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                                                {state === 'CHALLENGING' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sword className="w-5 h-5" />}
                                                {state === 'CHALLENGING' ? 'Challenging Captain...' : 'Challenge Team'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!isCaptain && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                                        <p className="text-sm text-gray-400 mb-4">Enter the Captain's code (their handle) to join their lobby.</p>
                                        <input type="text" value={targetHandle} onChange={(e) => setTargetHandle(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all mb-4" placeholder="Captain's Handle" />
                                        <button onClick={() => joinTeam(targetHandle)} disabled={!targetHandle || !isPeerReady} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">Join Team Lobby</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Match Settings Card */}
                <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl backdrop-blur-sm">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Waiting Room</h2>

                    {state === 'WAITING' ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5" />
                                Connected to <b>{opponent}</b>
                            </div>
                            {(!matchParams || matchParams.proposer || matchParams.agreed) && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">Select Difficulty</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="800" max="3500" step="100" value={rating} onChange={(e) => setRating(Number(e.target.value))} disabled={!!matchParams && !matchParams.agreed} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                                        <span className="font-mono text-purple-400 font-bold w-12">{rating}</span>
                                    </div>
                                </div>
                            )}
                            {matchParams && !matchParams.agreed && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-center animate-in fade-in">
                                    {matchParams.proposer ? (
                                        <p>Waiting for <b>{opponent}</b> to accept rating <b>{matchParams.rating}</b>...</p>
                                    ) : (
                                        <div>
                                            <p className="mb-3"><b>{opponent}</b> proposes a rated match: <b>{matchParams.rating}</b></p>
                                            <div className="flex gap-3">
                                                <button onClick={acceptProposal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex-1">Accept</button>
                                                <button onClick={rejectProposal} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex-1">Reject</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!matchParams ? (
                                <button onClick={() => proposeRating(rating)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                                    Propose Match ({rating})
                                </button>
                            ) : matchParams.agreed && matchParams.proposer ? (
                                <button onClick={findAndStart} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 animate-in zoom-in">
                                    {loading ? <Loader2 className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                    Start Match (Agreed: {matchParams.rating})
                                </button>
                            ) : matchParams.agreed && !matchParams.proposer ? (
                                <div className="text-center text-green-400 font-bold animate-in fade-in">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                    Waiting for host to start...
                                </div>
                            ) : null}

                            <div className="pt-6 border-t border-gray-800">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="bg-blue-500/20 text-blue-400 p-1 rounded-lg"><CheckCircle className="w-4 h-4" /></span>
                                    Problem Queue ({problemQueue.length})
                                </h3>
                                {problemQueue.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {problemQueue.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-800/50 p-2 px-3 rounded text-sm">
                                                <span className="font-mono text-gray-300">{p.index}. {p.name}</span>
                                                <span className="text-xs bg-gray-700 px-1.5 rounded">{p.rating}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-sm italic mb-4">No problems selected yet.</p>
                                )}
                                {(!matchParams || matchParams.agreed) && (
                                    <div className="flex gap-2">
                                        <button onClick={async () => { setLoading(true); const p = await getRandomProblem(rating); if (p) proposeProblem(p); setLoading(false); }} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "+"} Add Problem ({rating})
                                        </button>
                                        {problemQueue.length > 0 && (
                                            <button onClick={() => startMatch(undefined)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-lg shadow-green-500/20">
                                                Start Match ({problemQueue.length})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {pendingProblem && (
                                <div className="absolute inset-x-0 bottom-0 top-auto bg-gray-800 border-t border-gray-700 p-6 rounded-b-3xl animate-in slide-in-from-bottom-5">
                                    <h4 className="font-bold text-white mb-2">Opponent proposed a problem:</h4>
                                    <div className="bg-black/30 p-3 rounded mb-4">
                                        <p className="font-bold text-blue-400">{pendingProblem.name}</p>
                                        <p className="text-xs text-gray-500 flex gap-2 mt-1">
                                            <span>Rating: {pendingProblem.rating}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => acceptProblem(pendingProblem)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors">Accept</button>
                                        <button onClick={rejectProblem} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition-colors">Reject</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                            <p className="text-gray-500 italic">Accept a challenge or send one to start waiting room.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
