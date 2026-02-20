const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now, configure for production
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e6, // 1MB for Yjs updates
});

// State
let onlineUsers = {}; // socketId -> { handle, location, ... }
let matchmakingQueue = []; // [{ handle, socketId, rating }]
let activeDuels = {}; // roomId -> { players: [id1, id2], state... }
let teams = {}; // captainHandle -> { members: [{ handle, socketId }], teamRoom }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- REGISTRY ---
    socket.on('register', (data) => {
        onlineUsers[socket.id] = {
            ...data,
            socketId: socket.id
        };
        io.emit('users_online', Object.values(onlineUsers));
    });

    socket.on('update_status', (data) => {
        if (onlineUsers[socket.id]) {
            onlineUsers[socket.id] = { ...onlineUsers[socket.id], ...data };
            io.emit('users_online', Object.values(onlineUsers));
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const userInfo = onlineUsers[socket.id];
        delete onlineUsers[socket.id];

        // Remove from queue
        matchmakingQueue = matchmakingQueue.filter(u => u.socketId !== socket.id);

        // Clean up team membership
        if (userInfo && userInfo.handle) {
            Object.keys(teams).forEach(captainHandle => {
                const team = teams[captainHandle];
                team.members = team.members.filter(m => m.socketId !== socket.id);
                if (team.members.length === 0) {
                    delete teams[captainHandle];
                }
            });
        }

        io.emit('users_online', Object.values(onlineUsers));
    });

    // --- MATCHMAKING ---
    socket.on('join_queue', (data) => {
        // Avoid duplicates
        if (!matchmakingQueue.find(u => u.socketId === socket.id)) {
            matchmakingQueue.push({ ...data, socketId: socket.id });
            console.log("Player joined queue:", data.handle);
        }

        if (matchmakingQueue.length >= 2) {
            const p1 = matchmakingQueue.shift();
            const p2 = matchmakingQueue.shift();

            const roomId = `match_${p1.socketId}_${p2.socketId}`;

            io.to(p1.socketId).emit('match_found', { opponent: p2, roomId });
            io.to(p2.socketId).emit('match_found', { opponent: p1, roomId });

            console.log(`Matched ${p1.handle} vs ${p2.handle}`);
        }
    });

    socket.on('leave_queue', () => {
        matchmakingQueue = matchmakingQueue.filter(u => u.socketId !== socket.id);
    });

    // --- DUEL & CHALLENGES ---
    // Direct Challenge
    socket.on('challenge_request', (data) => {
        const targetSocketIds = Object.keys(onlineUsers).filter(
            id => onlineUsers[id].handle === data.targetHandle
        );

        if (targetSocketIds.length > 0) {
            targetSocketIds.forEach(targetSocketId => {
                io.to(targetSocketId).emit('challenge_received', {
                    from: onlineUsers[socket.id]?.handle || 'Unknown',
                    fromSocketId: socket.id,
                    rating: data.rating
                });
            });
        } else {
            socket.emit('challenge_error', { message: 'User not found or offline.' });
        }
    });

    socket.on('challenge_response', (data) => {
        if (data.accepted) {
            const roomId = `duel_${socket.id}_${data.targetSocketId}`;
            io.to(data.targetSocketId).emit('challenge_accepted', { roomId, opponent: onlineUsers[socket.id].handle });
            socket.emit('challenge_accepted', { roomId, opponent: onlineUsers[data.targetSocketId].handle });
        } else {
            io.to(data.targetSocketId).emit('challenge_rejected', { from: onlineUsers[socket.id].handle });
        }
    });

    // Game Room Events
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('game_start', (data) => {
        socket.to(data.roomId).emit('game_started', data);
    });

    socket.on('game_update', (data) => {
        socket.to(data.roomId).emit('opponent_update', data);
    });

    // --- TEAM LOGIC ---
    socket.on('team_join', (captainHandle) => {
        const captainId = Object.keys(onlineUsers).find(
            id => onlineUsers[id].handle === captainHandle
        );
        if (captainId) {
            const teamRoom = `team_${captainId}`;
            socket.join(teamRoom);

            // Track team membership
            if (!teams[captainHandle]) {
                teams[captainHandle] = { members: [], teamRoom };
            }
            const myHandle = onlineUsers[socket.id]?.handle || 'Unknown';
            if (!teams[captainHandle].members.find(m => m.handle === myHandle)) {
                teams[captainHandle].members.push({ handle: myHandle, socketId: socket.id });
            }

            io.to(captainId).emit('team_member_joined', {
                handle: myHandle,
                socketId: socket.id
            });
        }
    });

    // Team Duel Challenge (captain to captain)
    socket.on('team_duel_challenge', (data) => {
        // data: { targetCaptainHandle, teamId, teamName, members }
        const targetSocketIds = Object.keys(onlineUsers).filter(
            id => onlineUsers[id].handle === data.targetCaptainHandle
        );

        if (targetSocketIds.length > 0) {
            targetSocketIds.forEach(targetSocketId => {
                io.to(targetSocketId).emit('team_duel_challenge_received', {
                    from: onlineUsers[socket.id]?.handle || 'Unknown',
                    fromSocketId: socket.id,
                    teamName: data.teamName,
                    teamId: data.teamId,
                    members: data.members,
                });
            });
        } else {
            socket.emit('challenge_error', { message: 'Captain not found or offline.' });
        }
    });

    socket.on('team_duel_response', (data) => {
        // data: { accepted, targetSocketId, teamName, teamId, members }
        if (data.accepted) {
            const roomId = `team_duel_${socket.id}_${data.targetSocketId}`;
            
            // Notify both captains
            io.to(data.targetSocketId).emit('team_duel_accepted', {
                roomId,
                opponentTeamName: data.teamName,
                opponentMembers: data.members,
            });
            socket.emit('team_duel_accepted', {
                roomId,
                opponentTeamName: onlineUsers[data.targetSocketId]?.teamName || 'Unknown',
                opponentMembers: [],
            });
        } else {
            io.to(data.targetSocketId).emit('team_duel_rejected', {
                from: onlineUsers[socket.id]?.handle || 'Unknown',
            });
        }
    });

    socket.on('team_broadcast', (data) => {
        // data: { teamId, message }
        // Relay to everyone in the team room
        if (data.roomId) {
            socket.to(data.roomId).emit('team_broadcast', data);
        }
    });

    // --- YJS DOCUMENT RELAY ---
    // Pure relay — no state stored on server. Yjs CRDTs handle merge logic.
    socket.on('yjs_join', (data) => {
        if (data.roomId) {
            socket.join(`yjs_${data.roomId}`);
            console.log(`Socket ${socket.id} joined Yjs room: yjs_${data.roomId}`);
        }
    });

    socket.on('yjs_update', (data) => {
        // data: { roomId, update: number[] }
        if (data.roomId) {
            socket.to(`yjs_${data.roomId}`).emit('yjs_update', { update: data.update });
        }
    });

    socket.on('yjs_awareness', (data) => {
        // data: { roomId, update: number[] }
        if (data.roomId) {
            socket.to(`yjs_${data.roomId}`).emit('yjs_awareness', { update: data.update });
        }
    });

    // Generic Relay for signaling within a room
    socket.on('room_message', (data) => {
        // data: { roomId, type, payload }
        socket.to(data.roomId).emit('room_message', data);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
