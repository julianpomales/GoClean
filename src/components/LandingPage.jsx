import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export default function LandingPage({ onSignedIn }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      if (onSignedIn) onSignedIn()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col relative overflow-hidden">
      {/* Structural grid lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white" />
        <div className="absolute top-0 bottom-0 left-2/4 w-px bg-white" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full px-8 py-8 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tighter uppercase flex items-center gap-3">
          <span className="text-2xl">🧼</span> GOCLEAN
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-neon-green transition-colors"
        >
          [ AUTHENTICATE ]
        </button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-16 px-4 py-2 border border-slate-800 bg-[#121214] font-mono text-[10px] uppercase tracking-widest text-slate-400">
            <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
            LIVE LEDGER SYSTEM
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-6xl sm:text-8xl md:text-[9rem] leading-[0.85] tracking-tighter mb-10 text-white uppercase">
            KEEP IT
            <br />
            <span className="text-neon block mt-2">CLEAN.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-mono text-sm sm:text-base text-slate-400 leading-relaxed mb-20 max-w-xl mx-auto uppercase tracking-wide">
            Track every infraction. Watch the pool grow. 
            <br className="hidden sm:block" />
            No mercy. Real-time accountability.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-brutal flex items-center gap-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
              </svg>
              {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
            </button>

            {error && (
              <p className="font-mono text-red-500 text-xs uppercase tracking-widest bg-red-500/10 px-4 py-2 border border-red-500/20">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full px-8 py-8 flex items-center justify-between border-t border-slate-800/50 mt-20">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          GOCLEAN VERSION 1.0.0
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          SYSTEM ONLINE
        </span>
      </footer>
    </div>
  )
}
