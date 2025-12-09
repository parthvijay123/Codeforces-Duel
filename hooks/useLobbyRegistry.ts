'use client';

import { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

const REGISTRY_ID = 'cf-duel-registry-v1';

export type UserPresence = {
    handle: string;
    location: 'ONLINE_PAGE' | 'DUEL_LOBBY' | 'IN_GAME';
    isCaptain?: boolean;
    teamSize?: number;
}

export function useLobbyRegistry(
    myHandle: string,
    location: 'ONLINE_PAGE' | 'DUEL_LOBBY' | 'IN_GAME' = 'ONLINE_PAGE',
    isCaptain: boolean = false,
    teamSize: number = 0
) {
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'HOSTING' | 'OFFLINE'>('CONNECTING');

    const peerRef = useRef<Peer | null>(null);
    // Handle -> Connection
    const hostConnections = useRef<{ [handle: string]: DataConnection }>({});
    // Handle -> Presence
    const hostPresence = useRef<{ [handle: string]: UserPresence }>({});

    const [incomingInvite, setIncomingInvite] = useState<{ from: string } | null>(null);
    const registryConnRef = useRef<DataConnection | null>(null);

    useEffect(() => {
        if (!myHandle) return;

        // 1. Try to connect to Registry
        const myId = `cf-lobby-${Math.random().toString(36).substr(2, 9)}`;
        const peer = new Peer(myId);
        peerRef.current = peer;

        peer.on('open', () => {
            console.log("My Lobby ID:", myId);
            connectToRegistry(peer);
        });

        peer.on('error', (err) => {
            console.error("Lobby Peer Error:", err);
            if (err.type === 'peer-unavailable' && !isHost) {
                console.log("Registry not found. Becoming Host...");
                peer.destroy();
                becomeRegistry();
            }
        });

        return () => {
            peer.destroy();
        };
    }, [myHandle, location, isCaptain, teamSize]); // Re-register on status change

    const connectToRegistry = (peer: Peer) => {
        setStatus('CONNECTING');
        const conn = peer.connect(REGISTRY_ID);

        conn.on('open', () => {
            console.log("Connected to Registry");
            setStatus('CONNECTED');
            registryConnRef.current = conn;
            conn.send({ type: 'REGISTER', handle: myHandle, location, isCaptain, teamSize });
        });

        conn.on('data', (data: any) => {
            if (data.type === 'USER_LIST') {
                setOnlineUsers(data.users);
            } else if (data.type === 'INVITE_RECEIVED') {
                setIncomingInvite({ from: data.from });
            }
        });

        conn.on('close', () => {
            console.log("Registry disconnected.");
            setStatus('OFFLINE');
            registryConnRef.current = null;
            setTimeout(() => {
                peer.destroy();
                becomeRegistry();
            }, 1000 + Math.random() * 2000);
        });

        conn.on('error', (e) => {
            console.log("Conn error", e);
        });
    };

    const sendInvite = (targetHandle: string) => {
        if (isHost) {
            // I am host, send directly if connected
            const targetConn = hostConnections.current[targetHandle];
            if (targetConn && targetConn.open) {
                targetConn.send({ type: 'INVITE_RECEIVED', from: myHandle });
            }
        } else if (registryConnRef.current && registryConnRef.current.open) {
            // Send to registry to relay
            registryConnRef.current.send({ type: 'INVITE', to: targetHandle });
        }
    };

    const becomeRegistry = () => {
        try {
            const registry = new Peer(REGISTRY_ID);
            peerRef.current = registry;

            // Init me
            hostPresence.current[myHandle] = { handle: myHandle, location, isCaptain, teamSize };

            const broadcast = () => {
                const list = Object.values(hostPresence.current);
                setOnlineUsers(list);
                Object.values(hostConnections.current).forEach(conn => {
                    if (conn.open) conn.send({ type: 'USER_LIST', users: list });
                });
            };

            registry.on('open', () => {
                console.log("I am the Registry Host");
                setIsHost(true);
                setStatus('HOSTING');
                setOnlineUsers([{ handle: myHandle, location, isCaptain, teamSize }]);
            });

            registry.on('connection', (conn) => {
                conn.on('data', (data: any) => {
                    if (data.type === 'REGISTER') {
                        hostConnections.current[data.handle] = conn;
                        hostPresence.current[data.handle] = {
                            handle: data.handle,
                            location: data.location || 'ONLINE_PAGE',
                            isCaptain: data.isCaptain,
                            teamSize: data.teamSize
                        };
                        broadcast();
                    } else if (data.type === 'INVITE') {
                        // Relay invite
                        const targetConn = hostConnections.current[data.to];
                        // Find sender handle? 'conn' is associated with a handle.
                        // We stored it in hostConnections? Key is handle, Val is conn.
                        // Reverse lookup handle from conn
                        let senderHandle = '';
                        for (const [h, c] of Object.entries(hostConnections.current)) {
                            if (c === conn) {
                                senderHandle = h;
                                break;
                            }
                        }

                        // Or trust data payload? Verify for security? 
                        // For MVP trust reverse lookup to ensure validity.

                        if (targetConn && targetConn.open && senderHandle) {
                            console.log(`Relaying Invite from ${senderHandle} to ${data.to}`);
                            targetConn.send({ type: 'INVITE_RECEIVED', from: senderHandle });
                        }
                    }
                });

                conn.on('close', () => {
                    // Find who left
                    let leftHandle = null;
                    for (const [h, c] of Object.entries(hostConnections.current)) {
                        if (c === conn) {
                            leftHandle = h;
                            delete hostConnections.current[h];
                            break;
                        }
                    }
                    if (leftHandle) {
                        delete hostPresence.current[leftHandle];
                        broadcast();
                    }
                });
            });

            registry.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    registry.destroy();
                    const client = new Peer(`cf-lobby-${Math.random().toString(36).substr(2, 9)}`);
                    peerRef.current = client;
                    client.on('open', () => connectToRegistry(client));
                }
            });

        } catch (e) {
            console.error("Registry creation failed", e);
        }
    };

    return { onlineUsers, status, isHost, sendInvite, incomingInvite };
}
