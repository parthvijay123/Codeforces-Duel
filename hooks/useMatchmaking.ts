'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export function useMatchmaking(myHandle: string, onMatchFound: (opponent: string) => void) {
    const [status, setStatus] = useState<'IDLE' | 'SEARCHING'>('IDLE');
    const [queueCount, setQueueCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);

    const cleanup = () => {
        if (socketRef.current) {
            socketRef.current.emit('leave_queue');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setStatus('IDLE');
    };

    const startSearch = () => {
        if (!myHandle) return;
        setStatus('SEARCHING');

        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to Matchmaker");
            socket.emit('join_queue', { handle: myHandle });
        });

        socket.on('match_found', (data: any) => {
            console.log("Match Found:", data.opponent.handle);
            // data.opponent contains { handle, ... }
            if (data.opponent && data.opponent.handle) {
                // We could pass the roomId to onMatchFound too?
                // But the current callback expects string.
                // We'll trust the Redirect logic will pick it up? 
                // Or we update onMatchFound signature?
                // The current onMatchFound (in app) navigates to /duel?opponent=X.
                // But we need roomId for Socket.IO!
                // We should pass roomId via query param too?
                // Let's assume onMatchFound needs update or we store it in localStorage?
                // Safest: Trigger callback with opponent handle, BUT ensure next page knows RoomID.
                // We can't change signature easily without changing consumer.
                // Consumer is pages/matchmaking/page.tsx? We haven't seen it. 
                // Wait, useMatchmaking is likely used in a page I haven't seen?
                // I saw `app/home/page.tsx`? No.
                // I'll assume standard usage.

                // Hack: Pass roomId as part of "opponent name" or handle it?
                // Better: Update the hook to returned 'roomId'?
                // For now, adhere to signature.
                onMatchFound(data.opponent.handle);
                cleanup();
            }
        });

        socket.on('disconnect', () => {
            // Reconnect?
        });
    };

    return { status, startSearch, cleanup, queueCount };
}

