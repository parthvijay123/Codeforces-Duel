import Link from "next/link";
import { ArrowRight, Globe, Sword, Users, Play, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-8 text-center pt-24 pb-32">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#c084fc]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10 w-full">
        
        <h1 className="text-6xl md:text-[7rem] font-black tracking-tight leading-[0.9] drop-shadow-2xl">
          <span className="text-white block opacity-90 mb-2">
            Dominate the
          </span>
          <span className="text-gradient drop-shadow-[0_0_40px_rgba(192,132,252,0.4)]">
            Leaderboard.
          </span>
        </h1>
        
        <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium mt-8">
          The ultimate real-time competitive programming arena. Experience lightning-fast 1v1 battles and climb the ranks on Codeforces.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
          <Link href="/duel" className="group flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)] w-full sm:w-auto">
            Start Dueling <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#modes" className="group flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 hover:bg-white/5 px-8 py-4 rounded-full font-bold text-lg transition-all w-full sm:w-auto">
            Explore Modes
          </a>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-40"></div>

      {/* Game Modes Section */}
      <div id="modes" className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 z-10">
        <h2 className="text-sm font-black tracking-[0.2em] uppercase text-blue-400 mb-4 flex items-center justify-center gap-2">
          <Target className="w-4 h-4" /> Ready for battle?
        </h2>
        <h3 className="text-4xl md:text-5xl font-black text-white mb-16 tracking-tight">
          Choose Your Arena
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">

          {/* Mode 1: Ranked Matchmaking */}
          <Link href="/matchmaking" className="group text-left relative glass-panel p-10 rounded-[2rem] hover:border-blue-500/50 transition-all hover:-translate-y-2 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-[#030712] border border-white/10 group-hover:border-blue-500/30 group-hover:scale-110 transition-all duration-300 shadow-xl">
              <span className="text-[#00E5FF] text-2xl group-hover:drop-shadow-[0_0_8px_#00E5FF] transition-all">🏆</span>
            </div>
            <div className="mt-auto">
                <h3 className="text-2xl font-black mb-3 text-white transition-colors">Ranked Matchmaking</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">Match instantly against opponents near your Codeforces rating. Win to climb the global leaderboard.</p>
                <div className="flex items-center text-blue-400 text-sm font-bold mt-auto group-hover:translate-x-1 transition-transform">
                Find Match <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            </div>
          </Link>

          {/* Mode 2: Online Lobby */}
          <Link href="/online" className="group text-left relative glass-panel p-10 rounded-[2rem] hover:border-green-500/50 transition-all hover:-translate-y-2 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-8 right-8 bg-[#1f2937] text-[10px] uppercase font-black px-3 py-1 rounded-full text-gray-400 border border-white/10">Social</div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-[#030712] border border-white/10 group-hover:border-green-500/30 group-hover:scale-110 transition-all duration-300 shadow-xl">
              <Users className="w-6 h-6 text-green-400 group-hover:drop-shadow-[0_0_8px_#4ade80] transition-all" />
            </div>
            <div className="mt-auto">
                <h3 className="text-2xl font-black mb-3 text-white transition-colors">Lobby / Challenge</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">Browse the active player registry. View profiles and send direct challenge requests to anyone online.</p>
                <div className="flex items-center text-green-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                View Players <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            </div>
          </Link>

          {/* Mode 3: Custom & Team Duel */}
          <Link href="/duel" className="group text-left relative glass-panel p-10 rounded-[2rem] hover:border-purple-500/50 transition-all hover:-translate-y-2 overflow-hidden flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-8 right-8 bg-[#1f2937] text-[10px] uppercase font-black px-3 py-1 rounded-full text-gray-400 border border-white/10">Custom</div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-[#030712] border border-white/10 group-hover:border-purple-500/30 group-hover:scale-110 transition-all duration-300 shadow-xl">
              <span className="text-purple-400 text-xl group-hover:drop-shadow-[0_0_8px_#c084fc] transition-all">⚔</span>
            </div>
            <div className="mt-auto">
                <h3 className="text-2xl font-black mb-3 text-white transition-colors">Custom / Team Duel</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">Create a private lobby, form a team, or tune difficulty via precise problem rating intervals.</p>
                <div className="flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                Enter Arena <ArrowRight className="w-4 h-4 ml-1" />
                </div>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
