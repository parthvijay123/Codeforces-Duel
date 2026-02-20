import re

with open('app/duel/page.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { useDuel } from '@/hooks/useDuel';", "import { useDuel } from '@/hooks/useDuel';\nimport { useTeamDuel, TeamInfo } from '@/hooks/useTeamDuel';")

# 2. Fetch Teams state
state_injection = """
    // Teams state
    const [myTeams, setMyTeams] = useState<TeamInfo[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null);

    useEffect(() => {
        fetch('/api/teams').then(res => res.json()).then(data => {
            if (data.teams) {
                setMyTeams(data.teams);
                if (data.teams.length > 0) setSelectedTeam(data.teams[0]);
            }
        });
    }, []);

    const teamDuel = useTeamDuel(myHandle, selectedTeam);

    const isTeamMode = mode === 'TEAM';
    const activeState = isTeamMode ? teamDuel.gameState : state;
    const activeProblem = isTeamMode ? problem : problem; // problem is stored in useDuel for now, or we can just let useDuel handle problem selection
"""
content = content.replace("const [targetHandle, setTargetHandle] = useState('');", state_injection + "\n    const [targetHandle, setTargetHandle] = useState('');")

# 3. Game block condition
content = content.replace("if (state === 'IN_GAME' && problem) {", "if ((state === 'IN_GAME' || teamDuel.gameState === 'IN_GAME') && problem) {")

# 4. CodeEditor in Game block
editor_old = "<CodeEditor value={code} onChange={(val) => setCode(val || '')} />"
editor_new = """<CodeEditor 
    value={code} 
    onChange={(val) => setCode(val || '')}
    collaborative={mode === 'TEAM'}
    ydoc={teamDuel.ydoc || undefined}
    provider={teamDuel.provider || undefined}
    userName={myHandle}
/>"""
content = content.replace(editor_old, editor_new)

# 5. Team Lobby Block Replacement
lobby_start = "                            <h2 className=\"text-2xl font-bold mb-4 flex items-center gap-2\">"
lobby_end = "                                </div>\n                            )}\n                        </div>"
# We'll use regex to replace the old team lobby
pattern = re.compile(r'<div className="animate-in fade-in slide-in-from-right-4 duration-300">\s*<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">.*?Team Lobby\s*</h2>.*?(?:</button>\s*</div>\s*</div>\s*)}?\s*</div>', re.DOTALL)

new_lobby = """<div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-purple-400" /> Team Battles
                            </h2>
                            {myTeams.length === 0 ? (
                                <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700">
                                    <p className="text-gray-400 mb-4">You are not in any teams yet.</p>
                                    <a href="/teams" className="btn-primary inline-flex">Manage Teams</a>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Select Your Team</label>
                                        <select 
                                            value={selectedTeam?.id || ''} 
                                            onChange={(e) => setSelectedTeam(myTeams.find(t => t.id === e.target.value) || null)}
                                            className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            {myTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.members.length}/3)</option>)}
                                        </select>
                                    </div>
                                    
                                    {selectedTeam && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                            <p className="text-sm font-bold text-purple-300 mb-2">Team Members</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTeam.members.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
                                                        <span className="w-2 h-2 rounded-full" style={{background: ['#ccff00', '#f43f5e', '#f97316'][i]}}></span>
                                                        <span className="text-white font-medium">{m.codeforcesHandle || m.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="border-t border-gray-800 pt-6 mt-6">
                                        <p className="text-sm font-bold text-gray-300 mb-4">Challenge Opposing Captain</p>
                                        <div className="space-y-4">
                                            <input type="text" value={targetHandle} onChange={(e) => setTargetHandle(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Opponent Captain's Handle" />
                                            <button onClick={() => teamDuel.challengeTeam(targetHandle)} disabled={!targetHandle || teamDuel.gameState === 'CHALLENGING'} className="w-full bg-purple-600 text-white hover:bg-purple-500 font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                {teamDuel.gameState === 'CHALLENGING' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sword className="w-5 h-5" />}
                                                {teamDuel.gameState === 'CHALLENGING' ? 'Challenging...' : 'Send Team Challenge'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>"""

content = pattern.sub(new_lobby, content)

# 6. Scoreboard - show Team vs Team
content = content.replace("""                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>YOU</div>""", """                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>{mode === 'TEAM' ? 'TEAM' : 'YOU'}</div>""")

content = content.replace("""                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>OPP</div>""", """                                <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',fontWeight:800,marginTop:'4px'}}>{mode === 'TEAM' ? 'OPP. TEAM' : 'OPP'}</div>""")

# 7. Use getCode() from teamDuel
# Actually executeTests needs the collaborative code.
execute_old = "const res = await fetch('/api/execute', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ code, language: 'cpp', samples }),\n            });"
execute_new = "const currentCode = mode === 'TEAM' ? teamDuel.getCode() : code;\n            const res = await fetch('/api/execute', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ code: currentCode, language: 'cpp', samples }),\n            });"
content = content.replace(execute_old, execute_new)

# 8. Start match - hook into teamDuel
content = content.replace("startMatch(prob);", "if (mode === 'TEAM') { teamDuel.startTeamGame(prob); startMatch(prob); } else { startMatch(prob); }")

with open('app/duel/page.tsx', 'w') as f:
    f.write(content)
