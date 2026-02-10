import Link from "next/link";
import { ArrowRight, Globe, Swords, Users } from "lucide-react";

export default function Home() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', width: '100%' }}>

      {/* Hero Section - Super Spacious */}
      <section style={{ paddingTop: '140px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '900px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(204, 255, 0, 0.2)',
            borderRadius: '9999px',
            padding: '8px 20px',
            marginBottom: '40px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 10px var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Real-Time Competitive Programming
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-jakarta), sans-serif',
            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            margin: '0 0 32px 0',
          }}>
            1v1 coding battles.<br />
            <span style={{ color: 'var(--accent)' }}>Ranked.</span> Real-time.
          </h1>

          <p style={{
            fontSize: '1.25rem',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
            margin: '0 0 56px 0',
            maxWidth: '600px',
          }}>
            Challenge opponents matched to your Codeforces rating. Solve problems head-to-head and climb the global leaderboard.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <Link
              href="/duel"
              className="btn-primary"
            >
              Start Dueling <ArrowRight size={20} strokeWidth={3} />
            </Link>
            <a
              href="#modes"
              className="btn-ghost"
            >
              Explore Modes
            </a>
          </div>
        </div>
      </section>



      {/* Modes - Bento Box Layout */}
      <section id="modes" style={{ padding: '60px 0 140px 0' }}>
        <div style={{ marginBottom: '80px' }}>
          <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
            Game Modes
          </p>
          <h2 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Choose your arena
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

          {/* Ranked Matchmaking */}
          <Link href="/matchmaking" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '48px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-dim)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={32} color="var(--accent)" strokeWidth={2.5} />
                </div>
                <span className="badge badge-lime">Ranked</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Ranked Matchmaking</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Instantly matched against opponents at your skill level. Win to climb the global leaderboard.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-jakarta)' }}>
                Find Match <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          {/* Online Lobby */}
          <Link href="/online" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '48px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-2-dim)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={32} color="var(--accent-2)" strokeWidth={2.5} />
                </div>
                <span className="badge badge-rose">Social</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Lobby / Challenge</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Browse the active player registry. Send direct challenge requests to anyone online right now.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-2)', fontFamily: 'var(--font-jakarta)' }}>
                View Players <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

          {/* Custom Duel */}
          <Link href="/duel" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '48px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-3-dim)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Swords size={32} color="var(--accent-3)" strokeWidth={2.5} />
                </div>
                <span className="badge badge-orange">Custom</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-jakarta), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>Custom / Team Duel</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Create a private lobby, form teams, or tune difficulty via precise problem rating ranges.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-3)', fontFamily: 'var(--font-jakarta)' }}>
                Enter Arena <ArrowRight size={20} strokeWidth={3} />
              </div>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
