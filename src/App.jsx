import { useState, useEffect, useRef } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'
import { motion } from 'framer-motion'
import CashPool from './components/CashPool'
import CountdownTimer from './components/CountdownTimer'
import Leaderboard from './components/Leaderboard'
import EntryFeed from './components/EntryFeed'
import AdminPanel from './components/AdminPanel'
import PinModal from './components/PinModal'
import Confetti from './components/Confetti'

function App() {
  const [participants, setParticipants] = useState([])
  const [entries, setEntries] = useState([])
  const [deadline, setDeadline] = useState(null)
  const [hasPin, setHasPin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('gc_admin') === '1')
  const [showPinModal, setShowPinModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const prevEntriesCount = useRef(0)

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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <Confetti trigger={confettiTrigger} />

      {showPinModal && (
        <PinModal
          hasPin={hasPin}
          onSuccess={() => { setIsAdmin(true); setShowPinModal(false) }}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧼</span>
            <div>
              <h1 className="text-white font-black text-xl leading-tight tracking-tight">GoClean</h1>
              <p className="text-slate-500 text-xs">Office Swear Jar Competition</p>
            </div>
          </div>
          <button
            onClick={handleAdminClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isAdmin
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500'
            }`}
          >
            {isAdmin ? '🛡️ Admin' : '🔐 Admin'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* Cash Pool + Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-slate-700/50 rounded-3xl p-6 md:p-10"
        >
          <CashPool total={totalPool} />
          <div className="border-t border-slate-700/50 mt-6 pt-6">
            <CountdownTimer deadline={deadline} />
          </div>
        </motion.div>

        {/* Admin Panel */}
        {isAdmin && (
          <AdminPanel
            participants={participants}
            entries={entries}
            deadline={deadline}
            onLock={handleLock}
          />
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Leaderboard participants={participants} />
        </motion.div>

        {/* Entry Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EntryFeed entries={entries} />
        </motion.div>

        <footer className="text-center text-slate-700 text-xs pb-4">
          GoClean · Keep it clean 🧼
        </footer>
      </main>
    </div>
  )
}

export default App
