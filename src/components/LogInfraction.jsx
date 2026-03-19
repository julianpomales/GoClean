import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const inputCls = 'w-full bg-[var(--color-card-bg)] border border-slate-700 rounded-none px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-green transition-colors placeholder-slate-600'
const labelCls = 'font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 block'

export default function LogInfraction({ groupId, participants }) {
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setLoading(true)
    const participant = participants.find(p => p.id === selectedId)
    if (!participant) { setLoading(false); return }
    const amount = participant.rate || 1
    await addDoc(collection(db, 'groups', groupId, 'entries'), {
      participantId: selectedId,
      participantName: participant.name,
      amount,
      note: note.trim(),
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'groups', groupId, 'participants', selectedId), {
      totalOwed: (participant.totalOwed || 0) + amount,
      swearCount: (participant.swearCount || 0) + 1,
    })
    setNote('')
    setSelectedId('')
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-[var(--color-card-bg)] border border-slate-800/80"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">LOG INFRACTION</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className={labelCls}>WHO SWORE?</label>
          {participants.length === 0 ? (
            <div className={`${inputCls} text-slate-600 flex items-center`}>
              [ ADD PEOPLE VIA ADMIN PANEL FIRST ]
            </div>
          ) : (
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls}>
              <option value="">[ SELECT PERSON ]</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ${(p.rate || 1).toFixed(2)}/infraction</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex-1">
          <label className={labelCls}>DETAILS (OPTIONAL)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='e.g. "Dropped coffee"'
            className={inputCls}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!selectedId || loading}
            className={`btn-brutal whitespace-nowrap ${success ? '!bg-emerald-500 !border-emerald-500 !text-white' : ''}`}
          >
            {success ? 'LOGGED ✓' : loading ? 'LOGGING...' : 'LOG IT'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
