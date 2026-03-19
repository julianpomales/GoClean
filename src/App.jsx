import { useState, useEffect, useRef } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { db, auth } from './firebase'
import { motion, AnimatePresence } from 'framer-motion'
import CashPool from './components/CashPool'
import CountdownTimer from './components/CountdownTimer'
import Leaderboard from './components/Leaderboard'
import EntryFeed from './components/EntryFeed'
import AdminPanel from './components/AdminPanel'
import PinModal from './components/PinModal'
import Confetti from './components/Confetti'
import SetupScreen from './components/SetupScreen'
import LandingPage from './components/LandingPage'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [entries, setEntries] = useState([])
  const [deadline, setDeadline] = useState(null)
  const [hasPin, setHasPin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('gc_admin') === '1')
  const [showPinModal, setShowPinModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const prevEntriesCount = useRef(0)

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  // Listen to participants
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Listen to entries
  useEffect(() => {
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const newEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (prevEntriesCount.current > 0 && newEntries.length > prevEntriesCount.current) {
        setConfettiTrigger(t => t + 1)
      }
      prevEntriesCount.current = newEntries.length
      setEntries(newEntries)
    })
    return unsub
  }, [])

  // Listen to settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'config'), snap => {
      if (snap.exists()) {
        const data = snap.data()
        setDeadline(data.deadline || null)
        setHasPin(!!data.pinHash)
      }
      setSettingsLoaded(true)
    })
    return unsub
  }, [])

  const totalPool = participants.reduce((sum, p) => sum + (p.totalOwed || 0), 0)

  const handleAdminClick = () => {
    if (isAdmin) return
    setShowPinModal(true)
  }

  const handleLock = () => {
    sessionStorage.removeItem('gc_admin')
    setIsAdmin(false)
  }

  const handleSignOut = async () => {
    sessionStorage.removeItem('gc_admin')
    setIsAdmin(false)
    await signOut(auth)
  }

  // ── Loading ──
  if (authLoading || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse-glow">
            <span className="text-4xl">🧼</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600 text-base">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading...
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Landing Page (not signed in) ──
  if (!user) {
    return <LandingPage />
  }

  // ── Setup Wizard (signed in, but no group created yet) ──
  if (!hasPin) {
    return <SetupScreen onComplete={() => {}} />
  }

  // ── Main Dashboard ──
  return (
    <div className="min-h-screen text-slate-200">
      <Confetti trigger={confettiTrigger} />

      <AnimatePresence>
        {showPinModal && (
          <PinModal
            hasPin={hasPin}
            onSuccess={() => { setIsAdmin(true); setShowPinModal(false) }}
            onClose={() => setShowPinModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0d17]/80 backdrop-blur-xl">
        <div className="w-full max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🧼</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-base leading-tight tracking-tight">GoClean</h1>
              <p className="text-slate-600 text-[11px] tracking-wide truncate">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAdminClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isAdmin
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.1]'
              }`}
            >
              {isAdmin ? '🛡️ Admin' : '🔐 Admin'}
            </button>
            {user.photoURL ? (
              <button onClick={handleSignOut} title="Sign out" className="group relative">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10 group-hover:border-white/20 transition-colors"
                />
                <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">↩</span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="bg-white/[0.03] border border-white/[0.06] text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.1] px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                title="Sign out"
              >
                ↩
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[720px] mx-auto px-6 py-10 flex flex-col gap-10">

        {/* Hero: Cash Pool + Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-3xl p-8 sm:p-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div className="relative">
            <CashPool total={totalPool} />
          </div>
          <div className="border-t border-white/[0.05] mt-8 pt-8 relative">
            <CountdownTimer deadline={deadline} />
          </div>
        </motion.div>

        {/* Admin Panel */}
        <AnimatePresence>
          {isAdmin && (
            <AdminPanel
              participants={participants}
              entries={entries}
              deadline={deadline}
              onLock={handleLock}
            />
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Leaderboard participants={participants} />
        </motion.div>

        {/* Entry Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <EntryFeed entries={entries} />
        </motion.div>

        <footer className="text-center text-slate-800 text-xs pb-10 pt-4 tracking-wide">
          GoClean · Keep it clean 🧼
        </footer>
      </main>
    </div>
  )
}

export default App
