import Link from "next/link";
import { ArrowRight, Code2, Globe, Sword, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-20 py-20">

      {/* Hero Section */}
      <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block animate-bounce bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/10">
          Only for real coders 🚀
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter pb-2 drop-shadow-2xl">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Code. Duel.
          </span>
          <br />
          <span className="text-white">Conquer.</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
          The ultimate real-time competitive programming arena. Prove your skills in 1v1 battles.
        </p>

        <div className="pt-8">
          <a href="#modes" className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-white/10">
            Play Now <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Game Modes Section */}
      <div id="modes" className="w-full max-w-7xl">
        <h2 className="text-3xl font-bold mb-12 flex items-center justify-center gap-3">
          <Zap className="text-yellow-400 fill-current" /> Choose Your Arena
        </h2>
        <div className="grid md:grid-cols-3 gap-8">

          {/* Mode 1: Ranked Matchmaking */}
          <Link href="/matchmaking" className="group relative bg-gray-900/40 hover:bg-gray-900/60 p-8 rounded-3xl border border-gray-800 hover:border-blue-500/50 transition-all hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Ranked Matchmaking</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">Let the system find a worthy opponent near your rating automatically.</p>
            <div className="flex items-center text-blue-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              Find Match <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Mode 2: Online Lobby */}
          <Link href="/online" className="group relative bg-gray-900/40 hover:bg-gray-900/60 p-8 rounded-3xl border border-gray-800 hover:border-green-500/50 transition-all hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <div className="bg-green-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition-colors">Online Lobby</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">Browse active players and send direct challenges to anyone online.</p>
            <div className="flex items-center text-green-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              View Players <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Mode 3: Custom & Team Duel */}
          <Link href="/duel" className="group relative bg-gray-900/40 hover:bg-gray-900/60 p-8 rounded-3xl border border-gray-800 hover:border-purple-500/50 transition-all hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <div className="bg-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <Sword className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Duel & Team Mode</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">Battle 1v1 or form a team to challenge other squads specifically.</p>
            <div className="flex items-center text-purple-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              Enter Arena <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
