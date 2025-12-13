'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Problem } from '@/lib/codeforces';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

type DuelState = 'LOBBY' | 'CHALLENGING' | 'WAITING' | 'IN_GAME';

export interface DuelMessage {
    type: 'CHALLENGE' | 'ACCEPT' | 'REJECT' | 'PROPOSE' | 'AGREE' | 'REJECT_PROPOSAL' | 'START' | 'UPDATE' | 'PROPOSE_PROBLEM' | 'ACCEPT_PROBLEM' | 'REJECT_PROBLEM' | 'NEXT_PROBLEM' | 'LEAVE' | 'JOIN_TEAM' | 'TEAM_UPDATE';
    payload?: any;
}

export function useDuel(myHandle: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

    const [mode, setMode] = useState<'SOLO' | 'TEAM'>('SOLO');
    const [isCaptain, setIsCaptain] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ handle: string }[]>([]);

    const [state, setState] = useState<DuelState>('LOBBY');
    const [opponent, setOpponent] = useState<string | null>(null);
    const [incomingChallenge, setIncomingChallenge] = useState<string | null>(null); // Handle of challenger
    const [incomingChallengeData, setIncomingChallengeData] = useState<any>(null); // Store socketId/rating

    const [problem, setProblem] = useState<Problem | null>(null);
    const [opponentStatus, setOpponentStatus] = useState<'idle' | 'solved' | 'failed' | 'left'>('idle');
    const [isPeerReady, setIsPeerReady] = useState(false); // Map to Socket Connected

    const [matchParams, setMatchParams] = useState<{ rating: number, agreed: boolean, proposer: boolean } | null>(null);

    const [opponentRating, setOpponentRating] = useState<number>(1200);
    const [problemQueue, setProblemQueue] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [pendingProblem, setPendingProblem] = useState<Problem | null>(null);

    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);

    // Refs for closures
    const stateRef = useRef(state);
    const activeRoomIdRef = useRef(activeRoomId);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

    const reset = () => {
        if (socket && activeRoomId) {
            socket.emit('room_message', { roomId: activeRoomId, type: 'LEAVE' });
            socket.emit('leave_room', activeRoomId);
        }

        setActiveRoomId(null);
        setIncomingChallenge(null);
        setIncomingChallengeData(null);
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

        // Clear team?
        setTeamMembers([]);
    };

    // Initialize Socket
    useEffect(() => {
        if (!myHandle) return;

        console.log("Initializing Socket for handle:", myHandle);
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('My socket ID is:', newSocket.id);
            setIsPeerReady(true);
            newSocket.emit('register', { handle: myHandle, location: 'DUEL_LOBBY' });
        });

        newSocket.on('disconnect', () => {
            setIsPeerReady(false);
        });

        // --- Challenge Events ---
        newSocket.on('challenge_received', (data: any) => {
            // data: { from, fromSocketId, rating }
            if (stateRef.current === 'LOBBY' || stateRef.current === 'WAITING') {
                setIncomingChallenge(data.from);
                setIncomingChallengeData(data);
            } else {
                // Auto-reject if busy
                newSocket.emit('challenge_response', { accepted: false, targetSocketId: data.fromSocketId });
            }
        });

        newSocket.on('challenge_accepted', (data: any) => {
            // data: { roomId, opponent }
            console.log("Challenge Accepted!", data);
            setOpponent(data.opponent);
            setActiveRoomId(data.roomId);
            setState('WAITING');
            newSocket.emit('join_room', data.roomId);
        });

        newSocket.on('challenge_rejected', (data: any) => {
            alert(`${data.from} rejected your challenge.`);
            setState('LOBBY');
        });

        // --- Team Events ---
        newSocket.on('team_member_joined', (data: any) => {
            console.log("Member joined team:", data.handle);
            setTeamMembers(prev => [...prev, { handle: data.handle }]);
        });


        // --- Generic Room Messages (Game Logic) ---
        newSocket.on('room_message', (msg: DuelMessage) => {
            handleMessage(msg);
        });

        newSocket.on('game_started', (data: any) => {
            // Alias for START message if sent via specific event
            handleMessage({ type: 'START', payload: data });
        });

        newSocket.on('opponent_update', (data: any) => {
            handleMessage({ type: 'UPDATE', payload: data });
        });

        return () => {
            newSocket.disconnect();
            setIsPeerReady(false);
        };
    }, [myHandle]);


    const handleMessage = (msg: DuelMessage) => {
        console.log("Received:", msg);

        // Map payloads if needed
        if (msg.payload?.playerRating) {
            setOpponentRating(msg.payload.playerRating);
        }

        switch (msg.type) {
            case 'START':
                if (msg.payload.queue) {
                    setProblemQueue(msg.payload.queue);
                }
                if (msg.payload.problem && (!msg.payload.queue || msg.payload.queue.length === 0)) {
                    setProblemQueue([msg.payload.problem]);
                }
                setCurrentProblemIndex(0);
                setProblem(msg.payload.queue ? msg.payload.queue[0] : msg.payload.problem);
                setState('IN_GAME');
                setIncomingChallenge(null);
                setMatchParams(null);
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);
                break;

            case 'PROPOSE':
                setMatchParams({ rating: msg.payload.rating, agreed: false, proposer: false });
                break;

            case 'AGREE':
                setMatchParams(prev => prev ? { ...prev, agreed: true } : null);
                break;

            case 'REJECT_PROPOSAL':
                setMatchParams(null);
                alert("Opponent rejected the rating proposal.");
                break;

            case 'PROPOSE_PROBLEM':
                setPendingProblem(msg.payload.problem);
                break;

            case 'ACCEPT_PROBLEM':
                setProblemQueue(prev => [...prev, msg.payload.problem]);
                setPendingProblem(null);
                break;

            case 'REJECT_PROBLEM':
                alert("Opponent rejected the problem.");
                setPendingProblem(null);
                break;

            case 'NEXT_PROBLEM':
                const nextIdx = msg.payload.index;
                setCurrentProblemIndex(nextIdx);
                setProblem(msg.payload.queue ? msg.payload.queue[nextIdx] : null);
                setOpponentStatus('idle');
                break;

            case 'UPDATE':
                if (msg.payload.status) {
                    setOpponentStatus(msg.payload.status);
                    if (msg.payload.status === 'solved') {
                        setOpponentScore(prev => prev + 1);
                    }
                }
                break;

            case 'LEAVE':
                if (stateRef.current === 'IN_GAME') {
                    setOpponentStatus('left');
                } else {
                    reset();
                }
                break;
        }
    };


    // Actions
    const challengeUser = (targetHandle: string) => {
        if (!socket) return;
        if (targetHandle === myHandle) {
            alert("Cannot challenge self.");
            return;
        }

        setState('CHALLENGING');
        const stats = JSON.parse(localStorage.getItem('cf_duel_stats_v1') || '{"rating":1200}');
        socket.emit('challenge_request', { targetHandle, rating: stats.rating });
    };

    const acceptChallenge = () => {
        if (!socket || !incomingChallengeData) return;

        socket.emit('challenge_response', {
            accepted: true,
            targetSocketId: incomingChallengeData.fromSocketId
        });
        setIncomingChallenge(null);
        setIncomingChallengeData(null);
    };

    const rejectChallenge = () => {
        if (!socket || !incomingChallengeData) return;
        socket.emit('challenge_response', {
            accepted: false,
            targetSocketId: incomingChallengeData.fromSocketId
        });
        setIncomingChallenge(null);
        setIncomingChallengeData(null);
    };

    const sendToRoom = (msg: DuelMessage) => {
        if (socket && activeRoomId) {
            socket.emit('room_message', { roomId: activeRoomId, ...msg });
        }
    };

    const proposeRating = (rating: number) => {
        sendToRoom({ type: 'PROPOSE', payload: { rating } });
        setMatchParams({ rating, agreed: false, proposer: true });
    };

    const acceptProposal = () => {
        sendToRoom({ type: 'AGREE' });
        setMatchParams({ ...matchParams!, agreed: true });
    };

    const rejectProposal = () => {
        sendToRoom({ type: 'REJECT_PROPOSAL' });
        setMatchParams(null);
    };

    const sendUpdate = (status: 'solved' | 'failed') => {
        if (socket && activeRoomId) {
            // Use dedicated event or generic?
            // Use generic wrapper
            sendToRoom({ type: 'UPDATE', payload: { status } });
        }
    };

    const joinTeam = (captainHandle: string) => {
        if (!socket) return;
        setMode('TEAM');
        setIsCaptain(false);
        socket.emit('team_join', captainHandle);
        setOpponent(captainHandle); // UI treats captain as 'opponent' visual?
        setState('WAITING');
    };

    return {
        peer: null, // Deprecated
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
        acceptProposal,
        rejectProposal,

        proposeProblem: (prob: Problem) => sendToRoom({ type: 'PROPOSE_PROBLEM', payload: { problem: prob } }),
        acceptProblem: (prob: Problem) => {
            sendToRoom({ type: 'ACCEPT_PROBLEM', payload: { problem: prob } });
            setProblemQueue(prev => [...prev, prob]);
            setPendingProblem(null);
        },
        rejectProblem: () => {
            sendToRoom({ type: 'REJECT_PROBLEM' });
            setPendingProblem(null);
        },

        startMatch: (arg?: Problem | Problem[]) => {
            let finalQueue: Problem[] = [];
            if (Array.isArray(arg)) finalQueue = arg;
            else if (arg) finalQueue = [arg];
            else finalQueue = problemQueue;

            if (socket && activeRoomId && finalQueue.length > 0) {
                const stats = JSON.parse(localStorage.getItem('cf_duel_stats_v1') || '{"rating":1200}');
                const startMsg: DuelMessage = {
                    type: 'START',
                    payload: {
                        queue: finalQueue,
                        problem: finalQueue[0],
                        playerRating: stats.rating
                    }
                };

                sendToRoom(startMsg);

                setProblemQueue(finalQueue);
                setCurrentProblemIndex(0);
                setProblem(finalQueue[0]);
                setState('IN_GAME');
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);
            }
        },

        nextProblem: () => {
            if (socket && activeRoomId) {
                const nextIdx = currentProblemIndex + 1;
                if (nextIdx < problemQueue.length) {
                    sendToRoom({ type: 'NEXT_PROBLEM', payload: { index: nextIdx, queue: problemQueue } });
                }
            }
        },

        sendUpdate,
        reset
    };
}

