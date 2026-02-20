import re

with open('app/duel/page.tsx', 'r') as f:
    content = f.read()

# 1. State Injection
state_inj = """    const [myTeams, setMyTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

    useEffect(() => {
        fetch('/api/teams').then(res => res.json()).then(data => {
            if (data.teams) {
                setMyTeams(data.teams);
                if (data.teams.length > 0) setSelectedTeam(data.teams[0]);
            }
        });
    }, []);

    const [targetHandle, setTargetHandle] = useState('');"""
content = content.replace("    const [targetHandle, setTargetHandle] = useState('');", state_inj)

# 2. Extract useDuel variables
content = content.replace("        joinTeam", "        joinTeam,\n        ydoc,\n        provider,\n        sharedCode,\n        incomingChallengeData,\n        getCode")

# 3. CodeEditor Replacement
old_editor = "<CodeEditor value={code} onChange={(val) => setCode(val || '')} />"
new_editor = """<CodeEditor 
                                value={code} 
                                onChange={(val) => setCode(val || '')}
                                collaborative={mode === 'TEAM'}
                                ydoc={ydoc || undefined}
                                provider={provider || undefined}
                                userName={myHandle}
                            />"""
content = content.replace(old_editor, new_editor)

# 4. Challenge / Accept Actions
# Find <button onClick={acceptChallenge}
content = content.replace("<button onClick={acceptChallenge}", "<button onClick={() => acceptChallenge(selectedTeam)}")
# Find challengeUser(targetHandle) in solo mode
content = content.replace("onClick={() => challengeUser(targetHandle)}", "onClick={() => challengeUser(targetHandle, mode === 'TEAM' ? selectedTeam : undefined)}")

# 5. Team Lobby Rewrite
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
                                            {myTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.members.length}/3)</option>)}
                                        </select>
                                    </div>
                                    
                                    {selectedTeam && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                            <p className="text-sm font-bold text-purple-300 mb-2">Team Members</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTeam.members.map((m: any, i: number) => (
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
                                            <button onClick={() => challengeUser(targetHandle, selectedTeam)} disabled={!targetHandle || state === 'CHALLENGING'} className="w-full bg-purple-600 text-white hover:bg-purple-500 font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                {state === 'CHALLENGING' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sword className="w-5 h-5" />}
                                                {state === 'CHALLENGING' ? 'Challenging...' : 'Send Team Challenge'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>"""
content = pattern.sub(new_lobby, content)

# 6. executeTests fix
execute_old = "body: JSON.stringify({ code, language: 'cpp', samples }),"
execute_new = "body: JSON.stringify({ code: mode === 'TEAM' ? getCode() : code, language: 'cpp', samples }),"
content = content.replace(execute_old, execute_new)

with open('app/duel/page.tsx', 'w') as f:
    f.write(content)
