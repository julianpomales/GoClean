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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

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

  if (authLoading || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
          <span className="text-6xl animate-pulse">🧼</span>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">INITIALIZING SYSTEM...</span>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  if (!hasPin) {
    return <SetupScreen onComplete={() => {}} />
  }

  return (
    <div className="min-h-screen bg-grain text-slate-200 font-sans selection:bg-neon-green selection:text-black">
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
      <header className="sticky top-0 z-40 bg-[var(--color-deep-bg)]/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl hidden sm:block">🧼</span>
            <div>
              <h1 className="font-display font-black text-xl tracking-tight uppercase leading-none">GOCLEAN</h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                OPERATOR: {user.displayName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdminClick}
              className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                isAdmin ? 'text-neon-green' : 'text-slate-500 hover:text-white'
              }`}
            >
              [{isAdmin ? 'ADMIN ACTIVE' : 'AUTH ADMIN'}]
            </button>
            <button onClick={handleSignOut} title="Sign out" className="group relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User"
                  className="w-10 h-10 rounded-none border border-slate-800 group-hover:border-neon-green transition-colors grayscale group-hover:grayscale-0"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-800 flex items-center justify-center font-mono text-xs text-slate-400 group-hover:text-neon-green transition-colors">
                  ESC
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Grid Lines Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
        <div className="w-full max-w-5xl mx-auto h-full border-x border-white" />
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">

        {/* Hero: Cash Pool + Countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-800/50 border border-slate-800/80 p-px">
          <div className="bg-[var(--color-card-bg)] p-8 sm:p-12 relative overflow-hidden group">
            <div className="absolute top-4 left-4 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <CashPool total={totalPool} />
          </div>
          <div className="bg-[var(--color-card-bg)] p-8 sm:p-12 flex items-center justify-center">
            <CountdownTimer deadline={deadline} />
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start mt-8">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Leaderboard participants={participants} />
          </motion.div>

          {/* Entry Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <EntryFeed entries={entries} />
          </motion.div>
        </div>

        <footer className="mt-20 py-8 border-t border-slate-800/50 flex items-center justify-between text-slate-600 font-mono text-[10px] uppercase tracking-widest">
          <span>GOCLEAN VERSION 1.0.0</span>
          <span>KEEP IT CLEAN 🧼</span>
        </footer>
      </main>
    </div>
  )
}

export default App
