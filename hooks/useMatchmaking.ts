'use client';

import { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

const MATCHMAKER_ID = 'cf-duel-matchmaker-v1'; // Versioned to avoid conflicts

export function useMatchmaking(myHandle: string, onMatchFound: (opponent: string) => void) {
    const [status, setStatus] = useState<'IDLE' | 'SEARCHING' | 'HOSTING'>('IDLE');
    const [queueCount, setQueueCount] = useState(0);
    const peerRef = useRef<Peer | null>(null);
    const retryTimeout = useRef<any>(undefined);

    const cleanup = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
        setStatus('IDLE');
    };

    const startSearch = () => {
        if (!myHandle) return;
        setStatus('SEARCHING');

        // 1. Try to connect to existing matchmaker
        // We need a temporary peer ID for ourselves to connect
        const myTempId = `cf-player-${Math.random().toString(36).substr(2, 9)}`;
        const tempPeer = new Peer(myTempId);
        peerRef.current = tempPeer;

        tempPeer.on('open', () => {
            const conn = tempPeer.connect(MATCHMAKER_ID);

            conn.on('open', () => {
                console.log("Connected to Matchmaker");
                conn.send({ type: 'QUEUE', handle: myHandle });
            });

            conn.on('data', (data: any) => {
                if (data.type === 'MATCH_FOUND') {
                    console.log("Match Found:", data.opponent);
                    onMatchFound(data.opponent);
                    cleanup();
                }
            });

            conn.on('error', (err) => {
                // If we can't connect, maybe matchmaker is down.
                // We should try to BECOME the matchmaker.
                console.log("Matchmaker unavailable, attempting to host...");
                tempPeer.destroy();
                becomeMatchmaker();
            });

            // If connection closes without match, retry or fail
            conn.on('close', () => {
                // Retry?
            });

            // Hack: PeerJS doesn't always emit error on connect fail fast enough.
            // If connection not open in 3s, try hosting.
            setTimeout(() => {
                if (!conn.open) {
                    console.log("Connection timed out, switching to Host mode");
                    tempPeer.destroy();
                    becomeMatchmaker();
                }
            }, 3000);
        });

        tempPeer.on('error', (err) => {
            // If we can't even create our own peer?
            console.error("Peer error", err);
        });
    };

    const becomeMatchmaker = () => {
        setStatus('HOSTING');
        try {
            const hostPeer = new Peer(MATCHMAKER_ID);
            peerRef.current = hostPeer;

            // Queue starts with ME (the host)
            // But 'conn' for me is null, so we handle it specially.
            const queue: { handle: string, conn: DataConnection | null }[] = [{ handle: myHandle, conn: null }];
            setQueueCount(1);

            hostPeer.on('open', () => {
                console.log("I am the Matchmaker now.");
            });

            hostPeer.on('connection', (conn) => {
                conn.on('data', (data: any) => {
                    if (data.type === 'QUEUE') {
                        console.log("Player queued:", data.handle);
                        queue.push({ handle: data.handle, conn });
                        setQueueCount(queue.length);

                        // Check for match
                        if (queue.length >= 2) {
                            const p1 = queue.shift()!; // Likely me
                            const p2 = queue.shift()!; // The new guy
                            setQueueCount(queue.length);

                            console.log(`Matching ${p1.handle} vs ${p2.handle}`);

                            // If P1 is me (conn is null), I just trigger callback
                            if (p1.conn === null) {
                                onMatchFound(p2.handle);
                            } else if (p1.conn.open) {
                                p1.conn.send({ type: 'MATCH_FOUND', opponent: p2.handle });
                            }

                            // If P2 is me (unlikely if FIFO), same logic
                            if (p2.conn === null) {
                                onMatchFound(p1.handle);
                            } else if (p2.conn.open) {
                                p2.conn.send({ type: 'MATCH_FOUND', opponent: p1.handle });
                            }

                            // Close connections/destroy peer to free up the ID?
                            // Actually, if we leave page, peer is destroyed.
                            // If we stay, we keep hosting?
                            // But onMatchFound navigates away! So peer will be destroyed.
                            // Perfect.
                        }
                    }
                });

                conn.on('close', () => {
                    // Remove from queue if disconnected
                    const idx = queue.findIndex(i => i.conn === conn);
                    if (idx !== -1) {
                        queue.splice(idx, 1);
                        setQueueCount(queue.length);
                    }
                });
            });

            hostPeer.on('error', (err) => {
                console.error("Matchmaker Host Error:", err);
                if (err.type === 'unavailable-id') {
                    // Someone else took it! Good. Go back to searching.
                    setStatus('IDLE');
                    startSearch();
                }
            });

        } catch (e) {
            console.error("Failed to host:", e);
        }
    };

    return { status, startSearch, cleanup, queueCount };
}
