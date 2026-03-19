import { useState, useEffect, useRef } from 'react'
import { collection, doc, onSnapshot, orderBy, query, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { motion, AnimatePresence } from 'framer-motion'
import CashPool from './CashPool'
import CountdownTimer from './CountdownTimer'

function LeaderboardDisplay({ participants }) {
  const sorted = [...participants].sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))
  const max = sorted[0]?.totalOwed || 1

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <p className="font-mono text-xs text-slate-700 uppercase tracking-widest">[ NO DATA YET ]</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">LEADERBOARD</p>
      <div className="flex flex-col divide-y divide-slate-800/60 border border-slate-800/60">
        {sorted.map((p, i) => {
          const isFirst = i === 0
          const pct = Math.round(((p.totalOwed || 0) / max) * 100)
          return (
            <div
              key={p.id}
              className={`relative flex items-center gap-4 px-5 h-[72px] overflow-hidden border-l-2 ${isFirst ? 'border-neon-green' : 'border-transparent'}`}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-700 ${isFirst ? 'bg-neon-green/5' : 'bg-slate-800/30'}`}
                style={{ width: `${pct}%` }}
              />
              <span className={`relative font-mono text-xs w-5 shrink-0 ${isFirst ? 'text-neon-green font-bold' : 'text-slate-600'}`}>
                {i + 1}
              </span>
              <div className={`relative w-8 h-8 shrink-0 flex items-center justify-center font-display font-black text-sm border ${isFirst ? 'border-neon-green/50 text-neon-green bg-neon-green/5' : 'border-slate-800 text-slate-500'}`}>
                {p.photoURL
                  ? <img src={p.photoURL} alt="" className="absolute inset-0 w-full h-full object-cover grayscale" onError={e => { e.currentTarget.style.display = 'none' }} />
                  : null
                }
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div className="relative flex-1 min-w-0">
                <p className={`font-display text-base uppercase tracking-wide truncate ${isFirst ? 'text-white font-bold' : 'text-slate-300'}`}>{p.name}</p>
                <p className="font-mono text-[10px] text-slate-600 mt-0.5">{p.swearCount || 0}× · ${p.rate || 1}/ea</p>
              </div>
              <span className={`relative font-mono text-lg font-bold shrink-0 ${isFirst ? 'text-neon-green' : 'text-slate-400'}`}>
                ${(p.totalOwed || 0).toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function FeedDisplay({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <p className="font-mono text-xs text-slate-700 uppercase tracking-widest">[ NO ACTIVITY YET ]</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">RECENT ACTIVITY</p>
      <div className="flex flex-col divide-y divide-slate-800/60 border border-slate-800/60">
        {entries.slice(0, 20).map((entry, i) => {
          const isLatest = i === 0
          return (
            <div
              key={entry.id}
              className={`relative flex items-center gap-4 px-5 h-[72px] overflow-hidden border-l-2 ${isLatest ? 'border-red-500' : 'border-transparent'}`}
            >
              {isLatest && <div className="absolute inset-y-0 left-0 w-full bg-red-500/5" />}
              <div className="relative w-8 h-8 shrink-0 flex items-center justify-center border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm font-bold">!</div>
              <div className="relative flex-1 min-w-0">
                <p className="font-display text-base uppercase tracking-wide text-white truncate">{entry.participantName}</p>
                <p className="font-mono text-[10px] text-slate-600 mt-0.5 truncate">
                  {entry.note ? `"${entry.note}"` : timeAgo(entry.createdAt)}
                </p>
              </div>
              <span className={`relative font-mono text-lg font-bold tracking-tight shrink-0 ${isLatest ? 'text-red-400' : 'text-slate-400'}`}>
                +${(entry.amount || 0).toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DisplayView({ token }) {
  const [group, setGroup] = useState(null)
  const [participants, setParticipants] = useState([])
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)

  // Decode token → groupId
  let groupId = null
  try {
    groupId = atob(token)
  } catch {
    // invalid token
  }

  useEffect(() => {
    if (!groupId) { setError('INVALID DISPLAY TOKEN'); return }

    // Fetch group doc
    const unsub = onSnapshot(doc(db, 'groups', groupId), snap => {
      if (!snap.exists()) { setError('GROUP NOT FOUND'); return }
      setGroup({ id: snap.id, ...snap.data() })
    }, () => setError('FAILED TO LOAD GROUP'))

    // Participants
    const pUnsub = onSnapshot(collection(db, 'groups', groupId, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Entries
    const q = query(collection(db, 'groups', groupId, 'entries'), orderBy('createdAt', 'desc'))
    const eUnsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})

    return () => { unsub(); pUnsub(); eUnsub() }
  }, [groupId])

  if (error) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-red-500 uppercase tracking-widest text-sm">[ {error} ]</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500 animate-pulse">LOADING...</span>
      </div>
    )
  }

  const totalPool = participants.reduce((sum, p) => sum + (p.totalOwed || 0), 0)
  const deadline = group.deadline

  return (
    <div className="min-h-screen bg-grain flex flex-col overflow-hidden">
      {/* Header */}
      <header className="w-full px-8 py-5 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🧼</span>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight uppercase text-white">{group.name}</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">LIVE DISPLAY</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">LIVE</span>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 w-full flex flex-col">
        {/* Hero: pool + countdown */}
        <div className="relative w-full border-b border-slate-800/70 bg-[var(--color-card-bg)] flex flex-col items-center justify-center px-8 py-0 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-white" />
          </div>
          <CashPool total={totalPool} tv />
          <div className="w-full border-t border-slate-800/60 py-10">
            <CountdownTimer deadline={deadline} tv />
          </div>
        </div>

        {/* Leaderboard + Feed */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 pb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <LeaderboardDisplay participants={participants} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            <FeedDisplay entries={entries} />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
