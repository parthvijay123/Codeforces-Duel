# Codeforces Duel ⚔️

A real-time competitive coding platform where you can challenge friends or teams to Codeforces problems. Built with Next.js, PeerJS (WebRTC), and Monaco Editor.

## Features

- **1v1 Duels**: Challenge anyone by their Codeforces handle.
- **Team Duels**: Form teams, sync progress, and battle other teams.
- **Real-time Synchronization**: Game state, scores, and problem queue synced via PeerJS.
- **Integrated IDE**: Read problem statements and write C++ code directly in the app.
- **No Backend**: Uses peer-to-peer communication; no central database required for matches.

## Getting Started

### Prerequisites

You need **Node.js** installed on your machine.
- [Download Node.js](https://nodejs.org/) (Version 18+ recommended)

### Installation

1.  **Download/Clone the code** to your computer.
2.  Open a terminal (Command Prompt, PowerShell, or Terminal) in the project folder.
3.  Install dependencies:

```bash
npm install
```

### Running the App

1.  Start the development server:

```bash
npm run dev
```

2.  Open your browser and visit: [http://localhost:3000](http://localhost:3000)

## How to Play

1.  **Enter your Codeforces Handle** on the home screen.
2.  **Lobby**:
    *   **Solo Mode**: Enter an opponent's handle to challenge them directly.
    *   **Team Mode**: Create a team (share your handle as the code) or join a captain.
3.  **Start Match**: Once connected, the host can select difficulty and start the duel.
4.  **Battle**: Solve problems in the integrated IDE. Click "Verify" to check your submission against Codeforces.

## Troubleshooting

- **"Peer Unavailable"**: Ensure both players are on the "Duel Lobby" page and have entered their handles correctly.
- **"Network Error"**: Codeforces API might be limiting requests. Wait a moment and try again.
