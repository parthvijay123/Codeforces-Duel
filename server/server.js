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
    }
});

// State
let onlineUsers = {}; // socketId -> { handle, location, ... }
let matchmakingQueue = []; // [{ handle, socketId, rating }]
let activeDuels = {}; // roomId -> { players: [id1, id2], state... }

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
        delete onlineUsers[socket.id];

        // Remove from queue
        matchmakingQueue = matchmakingQueue.filter(u => u.socketId !== socket.id);

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
        // data.targetHandle is the handle of the user to challenge
        // Find socketId by handle
        const targetSocketId = Object.keys(onlineUsers).find(
            id => onlineUsers[id].handle === data.targetHandle
        );

        if (targetSocketId) {
            io.to(targetSocketId).emit('challenge_received', {
                from: onlineUsers[socket.id].handle,
                fromSocketId: socket.id,
                rating: data.rating
            });
        }
    });

    socket.on('challenge_response', (data) => {
        // data: { accepted: boolean, targetSocketId: string }
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
        // data: { roomId, problems, ... }
        socket.to(data.roomId).emit('game_started', data);
    });

    socket.on('game_update', (data) => {
        // data: { roomId, type: 'solved' | 'failed', ... }
        socket.to(data.roomId).emit('opponent_update', data);
    });

    // Team Logic
    socket.on('team_join', (captainHandle) => {
        // Find captain's socket
        const captainId = Object.keys(onlineUsers).find(
            id => onlineUsers[id].handle === captainHandle
        );
        if (captainId) {
            const teamRoom = `team_${captainId}`;
            socket.join(teamRoom);

            // If captain is not in their own room yet?
            // Ideally captain joins it on creation.
            // But valid socket.io: we can just join.

            // Notify captain?
            io.to(captainId).emit('team_member_joined', {
                handle: onlineUsers[socket.id].handle,
                socketId: socket.id
            });
        }
    });

    socket.on('team_broadcast', (data) => {
        // data: { teamId, message }
        // socket.to(data.teamId).emit('team_message', data.message);
        // Basically relay everything.
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
