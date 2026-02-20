import re

with open('hooks/useDuel.ts', 'r') as f:
    content = f.read()

# Imports
content = content.replace("import { Problem } from '@/lib/codeforces';", "import { Problem } from '@/lib/codeforces';\nimport * as Y from 'yjs';\nimport { YjsSocketProvider } from '@/lib/yjs-socket-provider';")

# State
state_decl = """    const [targetUser, setTargetUser] = useState<string | null>(null);

    // Yjs State
    const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
    const [provider, setProvider] = useState<YjsSocketProvider | null>(null);
    const [sharedCode, setSharedCode] = useState('');
    const ydocRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<YjsSocketProvider | null>(null);
"""
content = content.replace("    const [targetUser, setTargetUser] = useState<string | null>(null);", state_decl)

# Reset
reset_block = """        setOpponentScore(0);

        if (providerRef.current) providerRef.current.destroy();
        if (ydocRef.current) ydocRef.current.destroy();
        setYdoc(null);
        setProvider(null);
        setSharedCode('');"""
content = content.replace("        setOpponentScore(0);", reset_block)

# Socket Events
socket_events = """        newSocket.on('challenge_rejected', (data: any) => {
            alert(`${data.from} rejected your challenge.`);
            setState('LOBBY');
        });

        // Team Challenge Events
        newSocket.on('team_duel_challenge_received', (data: any) => {
            if (stateRef.current === 'LOBBY' || stateRef.current === 'WAITING') {
                setIncomingChallenge(data.from);
                setIncomingChallengeData({ ...data, isTeam: true });
            }
        });

        newSocket.on('team_duel_accepted', (data: any) => {
            setOpponent(data.opponentTeamName || 'Opponent Team');
            setActiveRoomId(data.roomId);
            setState('WAITING');
            newSocket.emit('join_room', data.roomId);
        });

        newSocket.on('team_duel_rejected', () => {
            alert('Team challenge rejected.');
            setState('LOBBY');
        });"""
content = content.replace("""        newSocket.on('challenge_rejected', (data: any) => {
            alert(`${data.from} rejected your challenge.`);
            setState('LOBBY');
        });""", socket_events)

# handleMessage START
start_logic = """                setState('IN_GAME');
                setIncomingChallenge(null);
                setMatchParams(null);
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);

                // Init Yjs if in TEAM mode
                if (activeRoomIdRef.current) {
                    // Check if it's a team room based on ID pattern
                    const isTeamRoom = activeRoomIdRef.current.startsWith('team_duel_');
                    if (isTeamRoom) {
                        if (providerRef.current) providerRef.current.destroy();
                        if (ydocRef.current) ydocRef.current.destroy();
                        
                        const doc = new Y.Doc();
                        const myColor = ['#ccff00', '#f43f5e', '#f97316'][Math.floor(Math.random() * 3)];
                        const prov = new YjsSocketProvider(doc, socketRef.current!, activeRoomIdRef.current, {
                            name: myHandle,
                            color: myColor,
                        });

                        const ytext = doc.getText('code');
                        if (ytext.length === 0) {
                            ytext.insert(0, '// Team collaborative solution\\n#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    int t; cin >> t;\\n    while(t--) {\\n        \\n    }\\n    return 0;\\n}');
                        }

                        ytext.observe(() => {
                            setSharedCode(ytext.toString());
                        });
                        setSharedCode(ytext.toString());

                        ydocRef.current = doc;
                        providerRef.current = prov;
                        setYdoc(doc);
                        setProvider(prov);
                    }
                }"""
content = content.replace("""                setState('IN_GAME');
                setIncomingChallenge(null);
                setMatchParams(null);
                setOpponentStatus('idle');
                setMyScore(0);
                setOpponentScore(0);""", start_logic)

# challengeUser
content = content.replace("const challengeUser = (targetHandle: string) => {", "const challengeUser = (targetHandle: string, teamInfo?: any) => {")
challenge_logic = """        if (teamInfo) {
            socket.emit('team_duel_challenge', {
                targetCaptainHandle: targetHandle,
                teamId: teamInfo.id,
                teamName: teamInfo.name,
                members: teamInfo.members.map((m: any) => m.codeforcesHandle || m.username),
            });
        } else {
            socket.emit('challenge_request', { targetHandle, rating: myRating });
        }"""
content = content.replace("socket.emit('challenge_request', { targetHandle, rating: myRating });", challenge_logic)

# acceptChallenge / rejectChallenge
content = content.replace("const acceptChallenge = () => {", "const acceptChallenge = (teamInfo?: any) => {")
accept_logic = """        if (incomingChallengeData.isTeam && teamInfo) {
            socket.emit('team_duel_response', {
                accepted: true,
                targetSocketId: incomingChallengeData.fromSocketId,
                teamName: teamInfo.name,
                teamId: teamInfo.id,
                members: teamInfo.members.map((m: any) => m.codeforcesHandle || m.username),
            });
        } else {
            socket.emit('challenge_response', {
                accepted: true,
                targetSocketId: incomingChallengeData.fromSocketId
            });
        }"""
content = content.replace("""        socket.emit('challenge_response', {
            accepted: true,
            targetSocketId: incomingChallengeData.fromSocketId
        });""", accept_logic)


# Return values
content = content.replace("peer: null, // Deprecated", "ydoc,\n        provider,\n        sharedCode,\n        incomingChallengeData,")

# Expose getCode
content = content.replace("reset", "reset,\n        getCode: () => ydocRef.current ? ydocRef.current.getText('code').toString() : sharedCode")

with open('hooks/useDuel.ts', 'w') as f:
    f.write(content)
