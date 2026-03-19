import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  collection, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const inputCls = 'w-full bg-[var(--color-card-bg)] border border-slate-700 rounded-none px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-green transition-colors placeholder-slate-600'
const labelCls = 'font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 block'

export default function AdminPanel({ groupId, participants, entries, deadline, onLock }) {
  const [activeTab, setActiveTab] = useState('log')
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [logLoading, setLogLoading] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRate, setNewRate] = useState('1')
  const [addLoading, setAddLoading] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestRate, setGuestRate] = useState('1')
  const [guestLoading, setGuestLoading] = useState(false)
  const [editRates, setEditRates] = useState({})
  const [newDeadline, setNewDeadline] = useState(
    deadline
      ? new Date((deadline.toMillis ? deadline.toMillis() : new Date(deadline).getTime()) - new Date().getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16)
      : ''
  )
  const [deadlineLoading, setDeadlineLoading] = useState(false)

  const logSwear = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setLogLoading(true)
    const participant = participants.find(p => p.id === selectedId)
    if (!participant) { setLogLoading(false); return }
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
    setLogLoading(false)
    setLogSuccess(true)
    setTimeout(() => setLogSuccess(false), 2000)
  }

  const addParticipant = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAddLoading(true)
    await addDoc(collection(db, 'groups', groupId, 'participants'), {
      name: newName.trim(),
      rate: parseFloat(newRate) || 1,
      totalOwed: 0,
      swearCount: 0,
    })
    setNewName('')
    setNewRate('1')
    setAddLoading(false)
  }

  const addGuest = async (e) => {
    e.preventDefault()
    if (!guestName.trim()) return
    setGuestLoading(true)
    await addDoc(collection(db, 'groups', groupId, 'participants'), {
      name: guestName.trim(),
      rate: parseFloat(guestRate) || 1,
      totalOwed: 0,
      swearCount: 0,
      isGuest: true,
    })
    setGuestName('')
    setGuestRate('1')
    setGuestLoading(false)
  }

  const removeParticipant = async (id) => {
    if (!confirm('Remove this participant and their entries?')) return
    await deleteDoc(doc(db, 'groups', groupId, 'participants', id))
    const toDelete = entries.filter(e => e.participantId === id)
    await Promise.all(toDelete.map(e => deleteDoc(doc(db, 'groups', groupId, 'entries', e.id))))
  }

  const saveRate = async (id) => {
    const rate = parseFloat(editRates[id])
    if (isNaN(rate) || rate <= 0) return
    await updateDoc(doc(db, 'groups', groupId, 'participants', id), { rate })
    setEditRates(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const deleteEntry = async (entry) => {
    const participant = participants.find(p => p.id === entry.participantId)
    await deleteDoc(doc(db, 'groups', groupId, 'entries', entry.id))
    if (participant) {
      await updateDoc(doc(db, 'groups', groupId, 'participants', entry.participantId), {
        totalOwed: Math.max(0, (participant.totalOwed || 0) - entry.amount),
        swearCount: Math.max(0, (participant.swearCount || 0) - 1),
      })
    }
  }

  const saveDeadline = async (e) => {
    e.preventDefault()
    if (!newDeadline) return
    setDeadlineLoading(true)
    const ts = Timestamp.fromDate(new Date(newDeadline))
    await setDoc(doc(db, 'groups', groupId), { deadline: ts }, { merge: true })
    setDeadlineLoading(false)
  }

  const tabs = [
    { id: 'people', label: 'ROSTER' },
    { id: 'entries', label: 'HISTORY' },
    { id: 'settings', label: 'CONFIG' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-[var(--color-card-bg)] border border-neon-green/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neon-green/30 bg-neon-green/5">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="font-mono text-xs text-neon-green uppercase tracking-widest">ADMIN PORTAL ACTIVE</span>
        </div>
        <button
          onClick={onLock}
          className="font-mono text-[10px] text-slate-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          [ TERMINATE SESSION ]
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 font-mono text-xs uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? 'text-neon-green bg-slate-800/30 border-b-2 border-neon-green'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">

          {activeTab === 'log' && (
            <motion.form key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onSubmit={logSwear} className="flex flex-col gap-6">
              <div>
                <label className={labelCls}>SELECT TARGET</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls}>
                  <option value="">[ SELECT INDIVIDUAL ]</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.rate}/INFRACTION</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>INFRACTION DETAILS (OPTIONAL)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder='e.g. "Dropped coffee"' className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={!selectedId || logLoading}
                className={logSuccess ? 'btn-brutal !bg-emerald-500 !border-emerald-500 !text-white w-full' : 'btn-brutal w-full'}
              >
                {logSuccess ? 'INFRACTION LOGGED' : logLoading ? 'PROCESSING...' : 'LOG INFRACTION'}
              </button>
            </motion.form>
          )}

          {activeTab === 'people' && (
            <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">

              {/* Add guest */}
              <div className="flex flex-col gap-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-800">
                  ADD GUEST — NO ACCOUNT REQUIRED
                </div>
                <form onSubmit={addGuest} className="flex gap-3">
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="GUEST NAME"
                    className={`${inputCls} flex-1`}
                  />
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      value={guestRate}
                      onChange={e => setGuestRate(e.target.value)}
                      min="0.25" step="0.25"
                      className={`${inputCls} !pl-8`}
                    />
                  </div>
                  <button type="submit" disabled={!guestName.trim() || guestLoading} className="btn-brutal whitespace-nowrap shrink-0">
                    {guestLoading ? '...' : 'ADD GUEST'}
                  </button>
                </form>
                <p className="font-mono text-[10px] text-slate-600">
                  When a guest joins with a matching name, they’ll be prompted to merge their record with their account.
                </p>
              </div>

              <div className="flex flex-col gap-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-800">
                ROSTER — SET RATE PER INFRACTION
              </div>
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-4 bg-slate-800/20 border border-slate-800 px-4 py-3">
                  {/* Avatar */}
                  {p.photoURL
                    ? <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-none border border-slate-700 grayscale shrink-0" />
                    : <div className="w-8 h-8 border border-slate-700 bg-slate-800/50 flex items-center justify-center font-display font-bold text-sm text-slate-300 shrink-0">{p.name?.[0]?.toUpperCase() ?? '?'}</div>
                  }

                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-white text-base uppercase tracking-wider truncate">{p.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{p.swearCount || 0} infractions · ${(p.totalOwed || 0).toFixed(2)} owed</p>
                  </div>

                  {/* Rate edit — always visible */}
                  {editRates[p.id] !== undefined ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs">$</span>
                        <input
                          type="number"
                          value={editRates[p.id]}
                          onChange={e => setEditRates(prev => ({ ...prev, [p.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveRate(p.id)}
                          min="0.25" step="0.25"
                          className="w-20 bg-[var(--color-deep-bg)] border border-neon-green/50 pl-6 pr-2 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-neon-green"
                          autoFocus
                        />
                      </div>
                      <button onClick={() => saveRate(p.id)} className="font-mono text-xs text-neon-green hover:text-white transition-colors">SAVE</button>
                      <button onClick={() => setEditRates(prev => { const n = { ...prev }; delete n[p.id]; return n })} className="font-mono text-xs text-slate-500 hover:text-white transition-colors">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditRates(prev => ({ ...prev, [p.id]: String(p.rate || 1) }))}
                      className="shrink-0 flex items-center gap-2 font-mono text-sm text-slate-300 hover:text-neon-green border border-slate-700 hover:border-neon-green/50 px-3 py-1.5 transition-colors"
                    >
                      <span className="text-slate-500 text-xs">$</span>{(p.rate || 1).toFixed(2)}<span className="text-slate-600 text-[10px] ml-1">/ INFRACTION</span>
                    </button>
                  )}

                  <button onClick={() => removeParticipant(p.id)} className="font-mono text-[10px] text-red-600 hover:text-red-400 transition-colors shrink-0">[×]</button>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="font-mono text-xs text-center text-slate-600 py-8">[ MEMBERS WILL APPEAR WHEN THEY JOIN THE GROUP ]</p>
              )}
              </div>
            </motion.div>
          )}

          {activeTab === 'entries' && (
            <motion.div key="entries" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-slate-800/20 border border-slate-800 px-4 py-3 group">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="font-display text-white text-lg uppercase tracking-wider truncate">{entry.participantName}</p>
                    {entry.note && <p className="font-mono text-xs text-slate-500 truncate mt-1">"{entry.note}"</p>}
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <span className="font-mono text-red-400 text-lg">+${(entry.amount || 0).toFixed(0)}</span>
                    <button onClick={() => deleteEntry(entry)} className="font-mono text-[10px] text-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      [VOID]
                    </button>
                  </div>
                </div>
              ))}
              {entries.length === 0 && <p className="font-mono text-xs text-center text-slate-600 py-8">[ NO HISTORY ]</p>}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.form key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onSubmit={saveDeadline} className="flex flex-col gap-6">
              <div>
                <label className={labelCls}>TARGET DATE</label>
                <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className={inputCls} />
              </div>
              <button type="submit" disabled={!newDeadline || deadlineLoading} className="btn-brutal w-full">
                {deadlineLoading ? 'UPDATING...' : 'UPDATE SYSTEM PROTOCOL'}
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
