'use client';

import { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Problem } from '@/lib/codeforces';

type DuelState = 'LOBBY' | 'CHALLENGING' | 'WAITING' | 'IN_GAME';

export interface DuelMessage {
    type: 'CHALLENGE' | 'ACCEPT' | 'REJECT' | 'PROPOSE' | 'AGREE' | 'REJECT_PROPOSAL' | 'START' | 'UPDATE' | 'PROPOSE_PROBLEM' | 'ACCEPT_PROBLEM' | 'REJECT_PROBLEM' | 'NEXT_PROBLEM' | 'LEAVE' | 'JOIN_TEAM' | 'TEAM_UPDATE';
    payload?: any;
}

export function useDuel(myHandle: string) {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [connection, setConnection] = useState<DataConnection | null>(null); // Main opponent connection
    const [mode, setMode] = useState<'SOLO' | 'TEAM'>('SOLO');
    const [isCaptain, setIsCaptain] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ handle: string, conn: DataConnection }[]>([]);

    const [state, setState] = useState<DuelState>('LOBBY');
    const [opponent, setOpponent] = useState<string | null>(null);
    const [incomingChallenge, setIncomingChallenge] = useState<string | null>(null);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [opponentStatus, setOpponentStatus] = useState<'idle' | 'solved' | 'failed' | 'left'>('idle');
    const [isPeerReady, setIsPeerReady] = useState(false);

    const [matchParams, setMatchParams] = useState<{ rating: number, agreed: boolean, proposer: boolean } | null>(null);

    const reset = () => {
        if (connection) {
            try {
                connection.send({ type: 'LEAVE' });
            } catch (e) { console.error("Could not send leave", e); }
            try {
                connection.close();
            } catch (e) { console.error("Could not close connection", e); }
        }
        // If captain, close team connections? Or keep them?
        // Usually reset means reset MATCH, not Lobby.
        // But reset() is used for LogOut too.
        // Let's check context. reset() is used for "LogOut" button and "Play Again" (which resets match).
        // If "Play Again", we want to keep team.
        // If "LogOut" (handled by separate button potentially?), we want to leave everything.
        // Current 'reset' is used for both. We might need a hardReset vs softReset.
        // For now, let's assume reset clears everything including team for safety, 
        // OR we can make it smart based on mode.
        // Let's clear team members for now to be safe, user can reform team.
        teamMembers.forEach(m => {
            try { m.conn.close(); } catch (e) { }
        });
        setTeamMembers([]);
        setConnection(null);
        setIncomingChallenge(null);
        setOpponent(null);
        setProblem(null);
        setState('LOBBY');
        setOpponentStatus('idle');
        setMatchParams(null);
        setProblemQueue([]);
        setCurrentProblemIndex(0);
        setPendingProblem(null);
        setMyScore(0);
        setOpponentScore(0);
        // Do not reset mode or isCaptain automatically? Users might want to stay in team mode.
        // But if we clear teamMembers, we kind of reset the team state.
        // Let's keep mode but reset team members implies disbanded.
    };

    const createPeerId = (handle: string) => `cf-duel-${handle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    // Initialize Peer
    useEffect(() => {
        if (!myHandle) return;

        console.log("Initializing Peer for handle:", myHandle);
        const newPeer = new Peer(createPeerId(myHandle), {
            debug: 2,
        });

        newPeer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeer(newPeer);
            setIsPeerReady(true);
        });

        newPeer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);

            conn.on('data', (data: any) => {
                handleMessage(data, conn);
            });

            // Wait for open before handling
            conn.on('open', () => {
                // Connection established
            });
        });

        newPeer.on('error', (err) => {
            console.error("Peer error:", err);
            if (err.type === 'unavailable-id') {
                alert("You are already connected in another tab or the connection is stuck! Please close other tabs and reload.");
                setIsPeerReady(false);
            } else if (err.type === 'peer-unavailable') {
                alert("User not found! Make sure they are online and entered the LOBBY with this handle.");
                reset();
            } else if (err.type === 'network') {
                alert("Network error. Please check your internet connection.");
            }
        });

        return () => {
            newPeer.destroy();
            setIsPeerReady(false);
        };
    }, [myHandle]);

    const [opponentRating, setOpponentRating] = useState<number>(1200);
    const [problemQueue, setProblemQueue] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [pendingProblem, setPendingProblem] = useState<Problem | null>(null);

    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);

    // State Ref Pattern to solve Stale Closure in handleMessage
    const stateRef = useRef(state);
    const connectionRef = useRef(connection);
    const problemQueueRef = useRef(problemQueue);
    const modeRef = useRef(mode);
    const isCaptainRef = useRef(isCaptain);
    const teamMembersRef = useRef(teamMembers);
    const incomingChallengeRef = useRef(incomingChallenge);
    const matchParamsRef = useRef(matchParams);

    // Update refs whenever state changes
    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { connectionRef.current = connection; }, [connection]);
    useEffect(() => { problemQueueRef.current = problemQueue; }, [problemQueue]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { isCaptainRef.current = isCaptain; }, [isCaptain]);
    useEffect(() => { teamMembersRef.current = teamMembers; }, [teamMembers]);
    useEffect(() => { incomingChallengeRef.current = incomingChallenge; }, [incomingChallenge]);
    useEffect(() => { matchParamsRef.current = matchParams; }, [matchParams]);

    // ... (createPeerId) ...

    // Trigger update ref for callback
    // Actually simpler: define handleMessage inside useEffect [peer]? 
    // No, duplicate logic.
    // Refs are best status quo.

    // ... (useEffect init) ...
    // Note: handleMessage call in useEffect will use the closures above. 
    // BUT handleMessage ITSELF is defined here.
    // So handleMessage is recreated on every render.
    // BUT the listener `conn.on('data', ...)` binds the VERSION of handleMessage available at init time!
    // So we MUST use refs inside handleMessage.

    // Helper to broadcast message to all connected team members
    const teamBroadcast = (msg: DuelMessage) => {
        if (!isCaptainRef.current) return;
        teamMembersRef.current.forEach(m => {
            try {
                if (m.conn.open) m.conn.send(msg);
            } catch (e) { console.error("Broadcast error", e); }
        });
    };

    const handleMessage = (msg: DuelMessage, conn: DataConnection) => {
        console.log("Received:", msg);
        const oppHandle = conn.peer.replace('cf-duel-', '');

        if (msg.payload?.playerRating) {
            setOpponentRating(msg.payload.playerRating);
        }

        const currentState = stateRef.current;
        const currentMode = modeRef.current;
        const currentIsCaptain = isCaptainRef.current;

        switch (msg.type) {
            case 'CHALLENGE':
                if (currentState === 'LOBBY' || currentState === 'WAITING') {
                    setIncomingChallenge(oppHandle);
                    setConnection(conn);
                } else {
                    conn.send({ type: 'REJECT' });
                }
                break;
            case 'ACCEPT':
                setOpponent(oppHandle);
                setConnection(conn);
                setState('WAITING');
                break;
            case 'REJECT':
                alert(`${oppHandle} rejected your challenge.`);
                setConnection(null);
                setState('LOBBY');
                break;
            case 'PROPOSE':
                setMatchParams({ rating: msg.payload.rating, agreed: false, proposer: false });
                break;
            case 'AGREE':
                // Need previous params? Use functional update or ref.
                setMatchParams(prev => prev ? { ...prev, agreed: true } : null);
                break;
            case 'REJECT_PROPOSAL':
                setMatchParams(null);
                alert("Opponent rejected the rating proposal.");
                break;
            case 'PROPOSE_PROBLEM':
                console.log("Opponent proposed problem:", msg.payload.problem);
                setPendingProblem(msg.payload.problem);
                break;
            case 'ACCEPT_PROBLEM':
                console.log("Problem Accepted:", msg.payload.problem);
                setProblemQueue(prev => [...prev, msg.payload.problem]);
                setPendingProblem(null);
                break;
            case 'REJECT_PROBLEM':
                alert("Opponent rejected the problem.");
                setPendingProblem(null);
                break;
            case 'START':
                // Received by Opponent Captain OR Team Member
                if (msg.payload.queue) {
                    setProblemQueue(msg.payload.queue);
                }
                if (msg.payload.problem && (!msg.payload.queue || msg.payload.queue.length === 0)) {
                    setProblemQueue([msg.payload.problem]);
                }
                setCurrentProblemIndex(0);
                setProblem(msg.payload.queue ? msg.payload.queue[0] : msg.payload.problem);

                // If I am a Team Member, 'oppHandle' is my Captain.
                // But logically in the UI, I might want to see 'Team Duel' or similar?
                // For now, Member sees Captain as "Opponent" in state, but UI can show "Captain".
                if (currentMode === 'TEAM' && !currentIsCaptain) {
                    setOpponent(oppHandle); // This is Captain
                    setConnection(conn);    // Connection to Captain
                } else {
                    setOpponent(oppHandle); // Real Opponent
                    setConnection(conn);
                }

                setState('IN_GAME');
                setIncomingChallenge(null);
                setMatchParams(null);
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);

                // If I am Captain, Relay START to Team
                if (currentMode === 'TEAM' && currentIsCaptain) {
                    teamBroadcast(msg);
                }
                break;
            case 'NEXT_PROBLEM':
                const nextIdx = msg.payload.index;
                setCurrentProblemIndex(nextIdx);
                // SAFE access via Ref
                setProblem(problemQueueRef.current[nextIdx] || null);
                setOpponentStatus('idle');
                // If Captain, relay to team
                if (currentMode === 'TEAM' && currentIsCaptain) {
                    teamBroadcast(msg);
                }
                break;
            case 'JOIN_TEAM':
                if (currentMode === 'TEAM') {
                    const memberHandle = msg.payload.handle;
                    console.log("Adding team member:", memberHandle);
                    setTeamMembers(prev => {
                        // Avoid duplicates
                        if (prev.find(m => m.handle === memberHandle)) return prev;
                        return [...prev, { handle: memberHandle, conn }];
                    });
                }
                break;
            case 'TEAM_UPDATE':
                // Received by Captain from Member
                if (msg.payload.subType === 'SOLVED') {
                    // Member solved a problem. Increment Team Score.
                    setMyScore(prev => prev + 1);

                    // Relay to Opponent Captain (The real opponent)
                    const activeOpponentConn = connectionRef.current;
                    if (activeOpponentConn) {
                        activeOpponentConn.send({ type: 'UPDATE', payload: { status: 'solved' } });
                    }

                    // Optional: Broadcast to team that someone solved it? 
                    // Not crucial for MVP
                }
                break;
            case 'UPDATE':
                // Received from Opponent (Captain or Solo)
                if (msg.payload.status) {
                    setOpponentStatus(msg.payload.status);
                    if (msg.payload.status === 'solved') {
                        setOpponentScore(prev => prev + 1);
                    }
                }
                break;
            case 'LEAVE':
                // Use latest state to decide logic
                if (currentState === 'IN_GAME') {
                    setConnection(null);
                    setOpponentStatus('left');
                } else {
                    reset();
                }
                break;
        }
    };

    // ... (rest of function)

    // Helper to join a team
    const joinTeam = (captainHandle: string) => {
        if (!peer || !isPeerReady) return;
        setMode('TEAM');
        setIsCaptain(false); // Member

        const conn = peer.connect(createPeerId(captainHandle));
        conn.on('open', () => {
            console.log("Connected to Captain:", captainHandle);
            conn.send({ type: 'JOIN_TEAM', payload: { handle: myHandle } });
            setConnection(conn); // Member treats Captain as "Connection" approximately? 
            // profound architectural question:
            // If Member treats Captain as `connection`, then `startMatch` etc might work if Captain relays `START`.
            // Yes, let's treat Captain as the "Opponent" from Member's perspective for state flow, 
            // but UI needs to know it's "Captain".
            setOpponent(captainHandle); // Opponent UI will show Captain Name
            setState('WAITING'); // Waiting in lobby
        });
        conn.on('data', (data) => handleMessage(data as DuelMessage, conn));
    };

    const challengeUser = (targetHandle: string) => {
        if (!peer || !isPeerReady) {
            alert("Not connected. Wait.");
            return;
        }
        if (createPeerId(targetHandle) === peer.id) {
            alert("Cannot challenge self.");
            return;
        }

        setState('CHALLENGING');
        try {
            const conn = peer.connect(createPeerId(targetHandle));
            conn.on('open', () => {
                const stats = JSON.parse(localStorage.getItem('cf_duel_stats_v1') || '{"rating":1200}');
                conn.send({ type: 'CHALLENGE', payload: { playerRating: stats.rating } });
                setConnection(conn);
            });
            conn.on('data', (data: any) => handleMessage(data, conn));
            conn.on('error', (err) => { reset(); });
            conn.on('close', () => { reset(); });
        } catch (e) {
            reset();
        }
    };

    const acceptChallenge = () => {
        if (connection && incomingChallenge) {
            connection.send({ type: 'ACCEPT' });
            setOpponent(incomingChallenge);
            setState('WAITING');
            setIncomingChallenge(null);
        }
    };

    const rejectChallenge = () => {
        if (connection) {
            connection.send({ type: 'REJECT' });
            setIncomingChallenge(null);
            setConnection(null);
        }
    };

    const proposeRating = (rating: number) => {
        if (connection) {
            connection.send({ type: 'PROPOSE', payload: { rating } });
            setMatchParams({ rating, agreed: false, proposer: true });
        }
    };

    const acceptProposal = () => {
        if (connection && matchParams) {
            connection.send({ type: 'AGREE' });
            setMatchParams({ ...matchParams, agreed: true });
        }
    };

    const rejectProposal = () => {
        if (connection) {
            connection.send({ type: 'REJECT_PROPOSAL' });
            setMatchParams(null);
        }
    };

    const sendUpdate = (status: 'solved' | 'failed') => {
        // If I am Team Member, send TEAM_UPDATE to Captain
        if (mode === 'TEAM' && !isCaptain) {
            if (connection && status === 'solved') {
                connection.send({ type: 'TEAM_UPDATE', payload: { subType: 'SOLVED', handle: myHandle } });
                // I also increment my own score locally to see "Served"
                // But wait, myScore is team score?
                // If I solve, I contributed.
                // Let's increment myScore locally too? Or wait for captain? 
                // For simplified UX, increment locally.
                // But wait, `verify` calls `setMyScore`.
                // `sendUpdate` is called by `verify`.
            }
            return;
        }

        // If I am Solo or Captain, send normal UPDATE to Opponent
        if (connection) {
            // Note: In Team Mode, Captain's 'connection' is Opponent Captain. 
            // In Solo, it's Opponent.
            connection.send({ type: 'UPDATE', payload: { status } });
        }
    };

    return {
        // ... (existing)
        peer,
        isPeerReady,
        state,
        opponent,
        incomingChallenge,
        problem,
        opponentStatus,
        opponentRating,
        matchParams,
        problemQueue,
        currentProblemIndex,
        pendingProblem,
        myScore,
        setMyScore,
        opponentScore,
        setOpponentScore,

        // New Team Props
        mode,
        setMode,
        isCaptain,
        setIsCaptain,
        teamMembers,
        joinTeam,

        challengeUser,
        acceptChallenge,
        rejectChallenge,
        proposeRating,
        // ...
        acceptProposal,
        rejectProposal,
        proposeProblem: (prob: Problem) => {
            if (connection) connection.send({ type: 'PROPOSE_PROBLEM', payload: { problem: prob } });
        },
        acceptProblem: (prob: Problem) => {
            if (connection) {
                connection.send({ type: 'ACCEPT_PROBLEM', payload: { problem: prob } });
                setProblemQueue(prev => [...prev, prob]);
                setPendingProblem(null);
            }
        },
        rejectProblem: () => {
            if (connection) {
                connection.send({ type: 'REJECT_PROBLEM' });
                setPendingProblem(null);
            }
        },
        startMatch: (arg?: Problem | Problem[]) => {
            // Support both single problem (legacy/solo) and queue
            let finalQueue: Problem[] = [];

            if (Array.isArray(arg)) {
                finalQueue = arg;
            } else if (arg) {
                finalQueue = [arg];
            } else {
                finalQueue = problemQueue;
            }

            if (connection && finalQueue.length > 0) {
                const stats = JSON.parse(localStorage.getItem('cf_duel_stats_v1') || '{"rating":1200}');
                const startMsg: DuelMessage = {
                    type: 'START',
                    payload: {
                        queue: finalQueue, // Send full queue
                        problem: finalQueue[0], // For legacy compatibility
                        playerRating: stats.rating
                    }
                };

                // Send to opponent
                connection.send(startMsg);

                // Broadcast to Team
                if (mode === 'TEAM' && isCaptain) {
                    teamBroadcast(startMsg);
                }

                setProblemQueue(finalQueue);
                setCurrentProblemIndex(0);
                setProblem(finalQueue[0]);
                setState('IN_GAME');
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);
            } else if (!connection && arg && !Array.isArray(arg)) {
                // Solo mode fallback (if we want to support it roughly)
                setProblem(arg);
                setState('IN_GAME');
            }
        },
        nextProblem: () => {
            // ... existing
            // If captain, broadcast?
            if (connection) {
                const nextIdx = currentProblemIndex + 1;
                if (nextIdx < problemQueue.length) {
                    const payload = { index: nextIdx, queue: problemQueue };
                    const msg: DuelMessage = { type: 'NEXT_PROBLEM', payload };

                    connection.send(msg);
                    if (mode === 'TEAM' && isCaptain) {
                        teamBroadcast(msg);
                    }
                }
            }
        },
        sendUpdate,
        reset
    };
}
