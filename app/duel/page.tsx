'use client';

import { useState, useEffect, useRef } from 'react';
import { useDuel } from '@/hooks/useDuel';
import { useLobbyRegistry } from '@/hooks/useLobbyRegistry';
import { getRandomProblem, checkSubmission, getLatestSubmissionVerdict } from '@/lib/codeforces';
import { ExternalLink, CheckCircle, XCircle, Play, Loader2, Users, Sword, LogOut, Terminal, FlaskConical } from 'lucide-react';
import { GameResultModal } from '@/components/GameResultModal';
import { recordMatchToServer } from '@/lib/rating';
import { CodeEditor } from '@/components/CodeEditor';
import { ProblemStatement } from '@/components/ProblemStatement';
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
    const myRating = user?.rating || 1200;

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
        joinTeam,
        ydoc,
        provider,
        sharedCode,
        incomingChallengeData,
        getCode
    } = useDuel(myHandle, myRating);

    const { onlineUsers } = useLobbyRegistry(
        myHandle,
        state === 'IN_GAME' ? 'IN_GAME' : 'DUEL_LOBBY',
        isCaptain,
        teamMembers.length + 1
    );

    const [myTeams, setMyTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

    useEffect(() => {
        fetch('/api/teams').then(res => res.json()).then(data => {
            if (data.teams) {
                setMyTeams(data.teams);
                if (data.teams.length > 0) setSelectedTeam(data.teams[0]);
            }
        });
    }, []);

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

    // Test execution state
    const [samples, setSamples] = useState<{ input: string; output: string }[]>([]);
    const [executing, setExecuting] = useState(false);
    const [testResults, setTestResults] = useState<any[] | null>(null);
    const [execError, setExecError] = useState<string | null>(null);
    const [samplesPassed, setSamplesPassed] = useState(false);

    // CF AC polling
    const [isPollingForCF, setIsPollingForCF] = useState(false);
    const [cfVerdict, setCfVerdict] = useState<string | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch Problem Content when problem changes
    useEffect(() => {
        if (!problem) return;

        const fetchContent = async () => {
            setFetchingProblem(true);
            setError(null);
            setTestResults(null);
            setSamples([]);
            try {
                const res = await fetch(`/api/codeforces/problem?contestId=${problem.contestId}&index=${problem.index}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (data.html) setProblemHtml(data.html);
                if (data.samples && data.samples.length > 0) setSamples(data.samples);
            } catch (e: any) {
                console.error("Failed to fetch problem content", e);
                setError(e.message || "Failed to load problem.");
            } finally {
                setFetchingProblem(false);
            }
        };

        fetchContent();
        setCode('// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Problem: ' + (problem.name || 'Unknown') + '\n    int t; cin >> t;\n    while(t--) {\n        \n    }\n    return 0;\n}');
        // Reset submission state when problem changes
        setSamplesPassed(false);
        setIsPollingForCF(false);
        setCfVerdict(null);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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

    // Poll Codeforces for AC verdict
    useEffect(() => {
        if (!isPollingForCF || !problem || !myHandle || status === 'solved') return;

        const poll = async () => {
            try {
                const verdict = await getLatestSubmissionVerdict(myHandle, problem.contestId, problem.index);
                if (verdict) {
                    setCfVerdict(verdict);
                    if (verdict === 'OK') {
                        setStatus('solved');
                        sendUpdate('solved');
                        setMyScore(prev => prev + 1);
                        setIsPollingForCF(false);
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    }
                    // For TESTING/null verdicts, keep polling
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        };

        // Poll immediately then every 5 seconds
        poll();
        pollIntervalRef.current = setInterval(poll, 5000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [isPollingForCF, problem, myHandle, status]);

    const submitToCF = () => {
        if (!problem) return;
        const cfUrl = `https://codeforces.com/problemset/submit?submittedProblemCode=${problem.contestId}${problem.index}&programTypeId=73`;
        window.open(cfUrl, '_blank');
        setCfVerdict(null); // reset verdict for new submission
        setIsPollingForCF(true);
    };

    const executeTests = async () => {
        if (!code || samples.length === 0) return;
        setExecuting(true);
        setExecError(null);
        setTestResults(null);
        setSamplesPassed(false);
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: mode === 'TEAM' ? getCode() : code, language: 'cpp', samples }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setTestResults(data.results);

            if (data.allPassed) {
                // Samples passed — prompt user to submit to CF for real verification
                setSamplesPassed(true);
            }
        } catch (e: any) {
            setExecError(e.message || 'Execution failed');
        } finally {
            setExecuting(false);
        }
    };

    const handleForfeit = async () => {
        if (state === 'IN_GAME' && problem && opponent) {
            const ratingProblem = {
                name: problem.name,
                rating: problem.rating || 0,
                tags: problem.tags,
                url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                index: problem.index,
                contestId: problem.contestId,
            };
            try {
                await recordMatchToServer(opponent, opponentRating, ratingProblem, 'LOSS');
            } catch (e) {
                console.error('Failed to record forfeit:', e);
            }
        }
        reset();
    };


    // RENDER LOGIC

    // 1. INCOMING CHALLENGE MODAL
    if (incomingChallenge) {
        return (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'32px',backdropFilter:'blur(8px)'}}>
                <div className="card" style={{padding:'48px',maxWidth:'440px',width:'100%'}}>
                    <div style={{width:'64px',height:'64px',background:'var(--accent-dim)',borderRadius:'1rem',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px'}}>
                        <Sword size={32} color="var(--accent)" strokeWidth={2.5} />
                    </div>
                    <h3 style={{fontFamily:'var(--font-jakarta),sans-serif',fontSize:'2rem',fontWeight:800,color:'var(--text-primary)',margin:'0 0 16px 0',letterSpacing:'-0.02em'}}>
                        Challenge Received
                    </h3>
                    <p style={{fontSize:'1.1rem',color:'var(--text-secondary)',margin:'0 0 32px 0'}}>
                        <span style={{color:'var(--text-primary)',fontWeight:700}}>{incomingChallenge}</span> wants to duel you.
                    </p>
                    <div style={{display:'flex',gap:'16px'}}>
                        <button onClick={() => acceptChallenge(selectedTeam)} className="btn-primary" style={{flex:1,justifyContent:'center',padding:'16px'}}>Accept</button>
                        <button onClick={rejectChallenge} className="btn-ghost" style={{flex:1,justifyContent:'center',padding:'16px'}}>Decline</button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. GAME ROOM
    if (state === 'IN_GAME' && problem) {
        return (
            <div className="flex flex-col h-screen max-h-screen overflow-hidden" style={{background:'var(--bg-color)'}}>
                <div style={{height:'64px',flexShrink:0,borderBottom:'1px solid var(--border-color)',background:'var(--surface-color)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                        <span style={{fontFamily:'var(--font-jakarta),sans-serif',fontWeight:800,color:'var(--text-primary)',fontSize:'1.1rem'}}>{problem.contestId}{problem.index} — {problem.name}</span>
                        <span style={{background:'var(--surface-raised)',border:'1px solid var(--border-color)',fontSize:'0.85rem',padding:'4px 10px',borderRadius:'8px',color:'var(--text-secondary)',fontFamily:'monospace',fontWeight:600}}>{problem.rating}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'32px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'16px',fontFamily:'var(--font-jakarta)',fontSize:'1rem'}}>
                            <div style={{textAlign:'center'}}>
                                <div style={{fontWeight:800,color:'var(--accent)',fontSize:'1.5rem',lineHeight:1}}>{myScore}</div>
                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>YOU</div>
                            </div>
                            <div style={{color:'var(--border-color)',fontSize:'1.5rem',fontWeight:800,lineHeight:1}}>:</div>
                            <div style={{textAlign:'center'}}>
                                <div style={{fontWeight:800,color:'var(--danger)',fontSize:'1.5rem',lineHeight:1}}>{opponentScore}</div>
                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>OPP</div>
                            </div>
                        </div>
                        <button onClick={handleForfeit} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'8px',display:'flex',alignItems:'center',transition:'color 0.2s'}} title="Forfeit" onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='var(--danger)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='var(--text-muted)'}>
                            <LogOut size={20} />
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
                                    <ProblemStatement html={problemHtml} />
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
                            <CodeEditor 
                                value={code} 
                                onChange={(val) => setCode(val || '')}
                                collaborative={mode === 'TEAM'}
                                ydoc={ydoc || undefined}
                                provider={provider || undefined}
                                userName={myHandle}
                            />
                        </div>

                        {/* Test Results Panel */}
                        {testResults && (
                            <div className="border-t border-gray-700 bg-[#1a1a2e] max-h-48 overflow-y-auto">
                                <div className="px-4 py-2 bg-[#161625] border-b border-gray-700 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                    <Terminal className="w-3 h-3 text-blue-400" />
                                    <span className="text-gray-300">Test Results</span>
                                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-black ${
                                        testResults.every(r => r.passed)
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {testResults.filter(r => r.passed).length}/{testResults.length} PASSED
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-800">
                                    {testResults.map((r, i) => (
                                        <div key={i} className={`px-4 py-2 text-xs font-mono ${r.passed ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {r.passed
                                                    ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                                                    : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                                <span className={`font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>Test {i+1}</span>
                                                <span className="text-gray-500 ml-auto">{r.status} {r.time ? `· ${r.time}s` : ''}</span>
                                            </div>
                                            {!r.passed && !r.compile_output && (
                                                <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
                                                    <div><p className="text-gray-500 mb-0.5">Input</p><pre className="text-gray-300 whitespace-pre-wrap bg-black/30 p-1 rounded">{r.input}</pre></div>
                                                    <div><p className="text-gray-500 mb-0.5">Expected</p><pre className="text-green-300 whitespace-pre-wrap bg-black/30 p-1 rounded">{r.expected}</pre></div>
                                                    <div><p className="text-gray-500 mb-0.5">Got</p><pre className="text-red-300 whitespace-pre-wrap bg-black/30 p-1 rounded">{r.got || '(empty)'}</pre></div>
                                                </div>
                                            )}
                                            {r.compile_output && (
                                                <pre className="text-red-400 text-[10px] mt-1 whitespace-pre-wrap bg-black/30 p-2 rounded">{r.compile_output}</pre>
                                            )}
                                            {r.stderr && (
                                                <pre className="text-yellow-400 text-[10px] mt-1 whitespace-pre-wrap bg-black/30 p-2 rounded">{r.stderr}</pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {execError && (
                            <div className="border-t border-gray-700 bg-red-500/10 px-4 py-3 text-xs text-red-400 font-mono">
                                Error: {execError}
                            </div>
                        )}

                        {/* Samples passed → Submit to CF banner */}
                        {samplesPassed && status !== 'solved' && (
                            <div className="border-t border-green-500/30 bg-green-500/5 px-4 py-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                    <span className="text-green-400 font-bold">Samples passed!</span>
                                    {isPollingForCF ? (
                                        <span className="flex items-center gap-2 ml-1">
                                            {cfVerdict && cfVerdict !== 'OK' && cfVerdict !== 'TESTING' ? (
                                                <span className="text-red-400 font-bold">
                                                    {cfVerdict.replace(/_/g, ' ')}
                                                </span>
                                            ) : cfVerdict === 'TESTING' ? (
                                                <span className="text-yellow-400 flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Judging...
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400 flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Watching CF for verdict...
                                                </span>
                                            )}
                                            <button
                                                onClick={submitToCF}
                                                className="ml-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-bold rounded transition-colors"
                                                title="Submit again"
                                            >
                                                Re-submit
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 ml-1">Submit to CF — we'll auto-detect Accepted.</span>
                                    )}
                                </div>
                                {!isPollingForCF && (
                                    <button
                                        onClick={submitToCF}
                                        className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-black rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] shrink-0"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Submit to CF
                                    </button>
                                )}
                            </div>
                        )}

                        {status === 'solved' && (
                            <div className="border-t border-green-500/30 bg-green-500/10 px-4 py-2 flex items-center gap-2 text-xs">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-black">Accepted on Codeforces! 🎉 Opponent notified.</span>
                            </div>
                        )}

                        <div className="h-14 px-4 border-t border-gray-700 bg-[#252526] flex items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-gray-500">
                                {samples.length > 0 ? (
                                    <span>{samples.length} sample{samples.length > 1 ? 's' : ''} loaded</span>
                                ) : 'No samples'}
                            </div>
                            <div className="flex gap-2 items-center">
                                <a
                                    href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                                    title="View problem on Codeforces"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={executeTests}
                                    disabled={executing || samples.length === 0 || status === 'solved'}
                                    className="btn-primary"
                                    style={{fontSize:'0.95rem',padding:'10px 20px'}}
                                    title={samples.length === 0 ? 'No sample tests found' : 'Run against sample test cases'}
                                >
                                    {executing ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
                                    {executing ? 'Running…' : 'Run Tests'}
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
                            <div className="card" style={{padding:'48px',maxWidth:'440px',width:'100%',textAlign:'center'}}>
                                <h3 style={{fontFamily:'var(--font-jakarta),sans-serif',fontSize:'2rem',fontWeight:800,margin:'0 0 16px 0',color: status === 'solved' ? 'var(--accent)' : 'var(--danger)'}}>
                                    {status === 'solved' ? 'Round Won' : 'Round Lost'}
                                </h3>
                                <p style={{fontSize:'1.1rem',color:'var(--text-secondary)',margin:'0 0 32px 0'}}>
                                    {status === 'solved' ? 'Great job! Get ready for the next one.' : 'Opponent solved it first.'}
                                </p>
                                <button
                                    onClick={() => { setStatus('idle'); nextProblem(); }}
                                    className="btn-primary"
                                    style={{width:'100%',justifyContent:'center',padding:'16px'}}
                                >
                                    <Play size={20} strokeWidth={2.5} /> Next Problem ({currentProblemIndex + 2}/{problemQueue.length})
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
        <div style={{maxWidth:'1400px',margin:'0 auto',padding:'80px 32px',width:'100%'}}>
            <header style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'24px',marginBottom:'64px',paddingBottom:'32px',borderBottom:'1px solid var(--border-color)'}}>
                <div>
                    <h1 style={{fontFamily:'var(--font-jakarta),sans-serif',fontSize:'3.5rem',fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.03em',margin:'0 0 16px 0'}}>Arena Lobby</h1>
                    <p style={{fontSize:'1.2rem',color:'var(--text-secondary)',margin:0}}>Connected as <span style={{color:'var(--text-primary)',fontWeight:700}}>{myHandle || 'Unknown'}</span></p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'12px',background:'var(--surface-color)',border:'1px solid var(--border-color)',padding:'12px 24px',borderRadius:'1rem'}}>
                    <div style={{width:'12px',height:'12px',borderRadius:'50%',background: isPeerReady ? 'var(--success)' : 'var(--accent)',flexShrink:0,boxShadow: isPeerReady ? '0 0 10px var(--success)' : '0 0 10px var(--accent)'}} />
                    <span style={{fontFamily:'var(--font-jakarta)',fontSize:'0.9rem',fontWeight:800,color: isPeerReady ? 'var(--success)' : 'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
                        {isPeerReady ? 'Online' : 'Connecting…'}
                    </span>
                </div>
            </header>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))',gap:'32px'}}>
                {/* Challenge / Team Card */}
                <div className="card" style={{padding:'48px'}}>
                    <div style={{display:'flex',gap:'16px',marginBottom:'40px'}}>
                        <button onClick={() => setMode('SOLO')} className={mode === 'SOLO' ? 'btn-primary' : 'btn-ghost'} style={{flex:1,justifyContent:'center',padding:'16px'}}>Solo Duel</button>
                        <button onClick={() => setMode('TEAM')} className={mode === 'TEAM' ? 'btn-primary' : 'btn-ghost'} style={{flex:1,justifyContent:'center',padding:'16px'}}>Team Duel</button>
                    </div>

                    {mode === 'SOLO' ? (
                        <>
                            <div style={{width:'64px',height:'64px',background:'var(--accent-dim)',borderRadius:'1rem',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px'}}>
                                <Sword size={32} color="var(--accent)" strokeWidth={2.5} />
                            </div>
                            <h2 style={{fontFamily:'var(--font-jakarta),sans-serif',fontSize:'1.75rem',fontWeight:800,color:'var(--text-primary)',margin:'0 0 16px 0',letterSpacing:'-0.02em'}}>Challenge Player</h2>
                            <p style={{fontSize:'1.1rem',color:'var(--text-secondary)',margin:'0 0 32px 0'}}>Enter their exact Codeforces handle. They must be on this page right now.</p>
                            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                                <input
                                    type="text"
                                    value={targetHandle}
                                    onChange={(e) => setTargetHandle(e.target.value)}
                                    className="form-input"
                                    placeholder="Opponent's CF Handle"
                                />
                                <button
                                    onClick={() => challengeUser(targetHandle)}
                                    disabled={!targetHandle || state === 'CHALLENGING' || !isPeerReady}
                                    className="btn-primary"
                                    style={{width:'100%',justifyContent:'center',padding:'16px'}}
                                >
                                    {state === 'CHALLENGING' ? <Loader2 size={20} className="animate-spin" /> : <Sword size={20} strokeWidth={2.5} />}
                                    {state === 'CHALLENGING' ? 'Sending Challenge…' : 'Send Challenge'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-purple-400" /> Team Battles
                            </h2>
                            {myTeams.length === 0 ? (
                                <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700">
                                    <p className="text-gray-400 mb-4">You are not in any teams yet.</p>
                                    <a href="/teams" className="btn-primary inline-flex">Manage Teams</a>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Select Your Team</label>
                                        <select 
                                            value={selectedTeam?.id || ''} 
                                            onChange={(e) => setSelectedTeam(myTeams.find(t => t.id === e.target.value) || null)}
                                            className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            {myTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.members.length}/3)</option>)}
                                        </select>
                                    </div>
                                    
                                    {selectedTeam && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                            <p className="text-sm font-bold text-purple-300 mb-2">Team Members</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTeam.members.map((m: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                                                        <span className="w-2 h-2 rounded-full" style={{background: ['#ccff00', '#f43f5e', '#f97316'][i]}}></span>
                                                        <span className="text-white font-medium">{m.codeforcesHandle || m.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="border-t border-gray-800 pt-6 mt-6">
                                        <p className="text-sm font-bold text-gray-300 mb-4">Challenge Opposing Captain</p>
                                        <div className="space-y-4">
                                            <input type="text" value={targetHandle} onChange={(e) => setTargetHandle(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Opponent Captain's Handle" />
                                            <button onClick={() => challengeUser(targetHandle, selectedTeam)} disabled={!targetHandle || state === 'CHALLENGING'} className="w-full bg-purple-600 text-white hover:bg-purple-500 font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                {state === 'CHALLENGING' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sword className="w-5 h-5" />}
                                                {state === 'CHALLENGING' ? 'Challenging...' : 'Send Team Challenge'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Match Settings Card */}
                <div className="card" style={{padding:'48px',display:'flex',flexDirection:'column'}}>
                    <div style={{width:'64px',height:'64px',background:'var(--surface-raised)',border:'1px solid var(--border-color)',borderRadius:'1rem',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'24px'}}>
                        <Users size={32} color="var(--text-primary)" strokeWidth={2.5} />
                    </div>
                    <h2 style={{fontFamily:'var(--font-jakarta),sans-serif',fontSize:'1.75rem',fontWeight:800,color:'var(--text-primary)',margin:'0 0 40px 0',letterSpacing:'-0.02em'}}>Match Setup</h2>

                    {state === 'WAITING' ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 flex items-center gap-3 font-medium">
                                <CheckCircle className="w-6 h-6 shrink-0" />
                                <span>Connected to opponent <b>{opponent}</b></span>
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
                                <button onClick={() => proposeRating(rating)} className="btn-primary" style={{width:'100%',justifyContent:'center',padding:'16px'}}>
                                    Propose Match ({rating})
                                </button>
                            ) : matchParams.agreed && matchParams.proposer ? (
                                <button onClick={findAndStart} disabled={loading} className="btn-primary" style={{width:'100%',justifyContent:'center',padding:'16px'}}>
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} strokeWidth={2.5} />}
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
