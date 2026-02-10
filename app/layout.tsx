import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata: Metadata = {
  title: 'Codeforces Duel',
  description: 'Compete in real-time coding battles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col selection:bg-lime-500/30 selection:text-lime-200" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <AuthProvider>
          {/* Ambient Blurry Background */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none" style={{ background: 'var(--bg-color)' }}>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: 'var(--accent)', opacity: 0.15 }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ background: 'var(--accent)', opacity: 0.12 }} />
            <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full blur-[120px]" style={{ background: '#f97316', opacity: 0.1 }} />
          </div>
          
          <Navbar />
          <main className="flex-1 flex flex-col relative z-0">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
