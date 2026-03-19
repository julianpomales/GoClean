import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { motion, AnimatePresence } from 'framer-motion'
import CashPool from './CashPool'
import CountdownTimer from './CountdownTimer'

// ── TV design constants ──────────────────────────────────────────────────────
// Safe zone: 5% inset on all sides (TV overscan standard)
// Min readable font at 10ft: ~24px body, 32px+ for important data
// High contrast: no text below slate-300 for labels, white for data
// Max 8 leaderboard rows, 6 feed rows — density kills readability on TV
// No hover states — TV has no pointer
// Row height: 80px minimum for comfortable reading at distance
// ─────────────────────────────────────────────────────────────────────────────

function TVLeaderboard({ participants }) {
  const sorted = [...participants]
    .sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))
    .slice(0, 8)
  const max = sorted[0]?.totalOwed || 1

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-8 bg-neon-green block shrink-0" />
        <p className="font-mono text-base uppercase tracking-[0.25em] text-slate-300">LEADERBOARD</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="font-mono text-lg text-slate-600 uppercase tracking-widest">NO DATA YET</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((p, i) => {
            const isFirst = i === 0
            const pct = Math.round(((p.totalOwed || 0) / max) * 100)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={`relative flex items-center gap-5 h-[80px] px-5 overflow-hidden border-l-4 ${
                  isFirst ? 'border-neon-green bg-neon-green/5' : 'border-slate-700 bg-slate-800/20'
                }`}
              >
                {/* Progress bar fill */}
                <div
                  className={`absolute inset-y-0 left-0 ${isFirst ? 'bg-neon-green/8' : 'bg-slate-700/20'}`}
                  style={{ width: `${pct}%` }}
                />
                {/* Rank */}
                <span className={`relative font-mono text-xl font-bold w-8 shrink-0 tabular-nums ${
                  isFirst ? 'text-neon-green' : 'text-slate-500'
                }`}>
                  {i + 1}
                </span>
                {/* Avatar */}
                <div className={`relative w-12 h-12 shrink-0 flex items-center justify-center font-display font-black text-xl border-2 ${
                  isFirst ? 'border-neon-green/60 text-neon-green bg-neon-green/10' : 'border-slate-700 text-slate-400 bg-slate-800/50'
                }`}>
                  {p.photoURL && (
                    <img src={p.photoURL} alt="" className="absolute inset-0 w-full h-full object-cover grayscale" onError={e => { e.currentTarget.style.display = 'none' }} />
                  )}
                  <span className="relative">{p.name?.[0]?.toUpperCase()}</span>
                </div>
                {/* Name + sub */}
                <div className="relative flex-1 min-w-0">
                  <p className={`font-display text-2xl uppercase tracking-wide truncate leading-tight ${
                    isFirst ? 'text-white font-bold' : 'text-slate-200'
                  }`}>{p.name}</p>
                  <p className={`font-mono text-sm mt-0.5 ${isFirst ? 'text-neon-green/70' : 'text-slate-500'}`}>
                    {p.swearCount || 0} infractions &nbsp;·&nbsp; ${(p.rate || 1).toFixed(2)}/ea
                  </p>
                </div>
                {/* Amount */}
                <span className={`relative font-mono text-3xl font-bold tracking-tight shrink-0 tabular-nums ${
                  isFirst ? 'text-neon-green' : 'text-slate-300'
                }`}>
                  ${(p.totalOwed || 0).toFixed(2)}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
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

function TVFeed({ entries }) {
  const visible = entries.slice(0, 6)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-8 bg-red-500 block shrink-0" />
        <p className="font-mono text-base uppercase tracking-[0.25em] text-slate-300">RECENT ACTIVITY</p>
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="font-mono text-lg text-slate-600 uppercase tracking-widest">NO ACTIVITY YET</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visible.map((entry, i) => {
              const isLatest = i === 0
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className={`relative flex items-center gap-5 h-[80px] px-5 overflow-hidden border-l-4 ${
                    isLatest ? 'border-red-500 bg-red-500/5' : 'border-slate-700 bg-slate-800/20'
                  }`}
                >
                  {/* Icon */}
                  <div className={`relative w-12 h-12 shrink-0 flex items-center justify-center border-2 font-mono text-2xl font-black ${
                    isLatest ? 'border-red-500/60 text-red-400 bg-red-500/10' : 'border-slate-700 text-slate-500 bg-slate-800/50'
                  }`}>!</div>
                  {/* Name + note */}
                  <div className="relative flex-1 min-w-0">
                    <p className={`font-display text-2xl uppercase tracking-wide truncate leading-tight ${
                      isLatest ? 'text-white font-bold' : 'text-slate-200'
                    }`}>{entry.participantName}</p>
                    <p className={`font-mono text-sm mt-0.5 truncate ${isLatest ? 'text-red-400/70' : 'text-slate-500'}`}>
                      {entry.note ? `"${entry.note}"` : timeAgo(entry.createdAt)}
                    </p>
                  </div>
                  {/* Amount */}
                  <span className={`relative font-mono text-3xl font-bold tracking-tight shrink-0 tabular-nums ${
                    isLatest ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    +${(entry.amount || 0).toFixed(2)}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default function DisplayView({ token }) {
  const [group, setGroup] = useState(null)
  const [participants, setParticipants] = useState([])
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  // Tick every second to re-render timeAgo strings
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  let groupId = null
  try { groupId = atob(token) } catch {}

  useEffect(() => {
    if (!groupId) { setError('INVALID DISPLAY TOKEN'); return }
    const unsub = onSnapshot(doc(db, 'groups', groupId), snap => {
      if (!snap.exists()) { setError('GROUP NOT FOUND'); return }
      setGroup({ id: snap.id, ...snap.data() })
    }, () => setError('FAILED TO LOAD'))
    const pUnsub = onSnapshot(collection(db, 'groups', groupId, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const q = query(collection(db, 'groups', groupId, 'entries'), orderBy('createdAt', 'desc'))
    const eUnsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
    return () => { unsub(); pUnsub(); eUnsub() }
  }, [groupId])

  if (error) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <p className="font-mono text-red-500 uppercase tracking-widest text-xl">[ {error} ]</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <span className="font-mono text-base uppercase tracking-widest text-slate-400 animate-pulse">LOADING...</span>
      </div>
    )
  }

  const totalPool = participants.reduce((sum, p) => sum + (p.totalOwed || 0), 0)

  return (
    // TV safe zone: 5% inset on all edges
    <div className="min-h-screen bg-grain flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col m-[3%]">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl leading-none">🧼</span>
            <h1 className="font-display font-black text-3xl tracking-tight uppercase text-white leading-none">
              {group.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono text-base uppercase tracking-[0.2em] text-slate-300">LIVE</span>
          </div>
        </div>

        {/* ── Hero: pool + countdown side by side ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Pool */}
          <div className="relative bg-[var(--color-card-bg)] border border-slate-800 flex flex-col items-center justify-center py-8 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white" />
            </div>
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-slate-400 mb-4">TOTAL POOL</p>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-neon-green leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}>$</span>
              <span className="font-mono font-bold text-white leading-none tracking-tighter tabular-nums" style={{ fontSize: 'clamp(3rem, 8vw, 9rem)' }}>
                {totalPool.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-[var(--color-card-bg)] border border-slate-800 flex flex-col items-center justify-center py-8">
            <CountdownTimer deadline={group.deadline} tv />
          </div>
        </div>

        {/* ── Leaderboard + Feed ── */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-[var(--color-card-bg)] border border-slate-800 p-6">
            <TVLeaderboard participants={participants} />
          </div>
          <div className="bg-[var(--color-card-bg)] border border-slate-800 p-6">
            <TVFeed entries={entries} key={tick} />
          </div>
        </div>

      </div>
    </div>
  )
}
