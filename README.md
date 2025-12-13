# Codeforces Duel ⚔️

A modern, real-time competitive coding platform built for speed and collaboration. Codeforces Duel allows developers to challenge friends, form teams, and compete in algorithmic battles using problems directly from Codeforces.

## ✨ Features

- **Real-time 1v1 Duels**: Instant matchmaking and direct challenges using Socket.io.
- **👥 Team Battles**: Comprehensive team system—create squads, join lobbies, and compete member-vs-member or team-vs-team.
- **🚀 Live Synchronization**: Game state, scores, and problem queues synced instantly across all clients.
- **💻 Integrated IDE**: Full-featured C++ code editor (Monaco) embedded right in the browser.
- **🔍 Auto-Verification**: Seamless integration with Codeforces API to verify submissions and update scores in real-time.
- **🔒 Secure Authentication**: Robust user management with JWT and verified Codeforces handle linking.
- **📊 Matchmaking System**: Queue up and get paired with opponents of similar skill ratings.
- **📱 Responsive Design**: Sleek, dark-themed UI built with TailwindCSS for a premium experience on any device.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS
- **Editor**: Monaco Editor (VS Code core)
- **Icons**: Lucide React
- **Real-time**: Socket.io-client
- **State**: React Hooks & Context

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io (Rooms, Namespaces, Events)
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (JSON Web Tokens)
- **API**: Codeforces Official API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas Connection String)
- A Codeforces Account (for testing verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codeforces-duel.git
   cd codeforces-duel
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Configuration

1. **Frontend Environment**  
   Create a `.env.local` file in the root directory:
   ```env
   # Backend URL (Socket Server)
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   
   # MongoDB (for Next.js API routes)
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

2. **Backend Server Setup**  
   The Socket.IO server lives in the `server/` directory (created during migration).
   *Note: In production, this runs as a separate service.*

### Running the Application

1. **Start the Socket.IO Server** (Terminal 1)
   ```bash
   node server/server.js
   ```
   *Server runs on port 4000 by default.*

2. **Start the Next.js Frontend** (Terminal 2)
   ```bash
   npm run dev
   ```
   *Frontend runs on http://localhost:3000.*

3. **Visit the App**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

The application is architected to be deployed as two separate services:

1. **Frontend**: Deploy the Next.js app to **Vercel**.
   - Add Environment Variable: `NEXT_PUBLIC_SOCKET_URL` pointing to your backend.

2. **Backend**: Deploy the `server/` directory to **Render**, **Railway**, or **Heroku**.
   - Ensure the service exposes Port 4000 (or configure via `PORT` env var).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
