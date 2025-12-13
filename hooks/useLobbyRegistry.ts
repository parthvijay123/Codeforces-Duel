'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export type UserPresence = {
    handle: string;
    location: 'ONLINE_PAGE' | 'DUEL_LOBBY' | 'IN_GAME';
    isCaptain?: boolean;
    teamSize?: number;
    socketId?: string;
}

export function useLobbyRegistry(
    myHandle: string,
    location: 'ONLINE_PAGE' | 'DUEL_LOBBY' | 'IN_GAME' = 'ONLINE_PAGE',
    isCaptain: boolean = false,
    teamSize: number = 0
) {
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'OFFLINE'>('CONNECTING');
    const [incomingInvite, setIncomingInvite] = useState<{ from: string } | null>(null);

    // We keep a ref to the socket to avoid re-connections on every render, 
    // but we might want to re-register if props change.
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!myHandle) return;

        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        setStatus('CONNECTING');

        socket.on('connect', () => {
            console.log("Connected to Registry Server:", socket.id);
            setStatus('CONNECTED');
            socket.emit('register', { handle: myHandle, location, isCaptain, teamSize });
        });

        socket.on('users_online', (users: UserPresence[]) => {
            setOnlineUsers(users);
        });

        socket.on('challenge_received', (data: any) => {
            // If we are in lobby, we might get challenges here if we don't have useDuel active?
            // But useDuel handles challenges.
            // If useLobbyRegistry is used on pages WITHOUT useDuel, we might want to show a notif?
            // For now, useDuel handles it. useLobbyRegistry is just for listing.
            // But WAIT. The "Invite" feature in current implementation was for "Teaam Invite".
            // Socket.io 'challenge_received' is for Duel.
            // We need 'invite_received'?
        });

        // Custom invite event for teams? 
        // We didn't implement 'invite' in server.js yet, but we can relay generic messages.
        // For now, let's assume team invites are handled or we'll add 'invite' support.

        socket.on('disconnect', () => {
            setStatus('OFFLINE');
        });

        return () => {
            socket.disconnect();
        };
    }, [myHandle, location, isCaptain, teamSize]);

    // Send Invite (for teams)
    const sendInvite = (targetHandle: string) => {
        // Not fully implemented in server yet, but placeholder:
        // We can use a generic event or add specific support.
        console.log("Team Invite not fully migrated yet.");
    };

    return { onlineUsers, status, isHost: false, sendInvite, incomingInvite };
}

