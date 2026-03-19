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
    { id: 'log', label: 'LOG' },
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
            <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-8">
              <form onSubmit={addParticipant} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="IDENTIFIER" className={inputCls} />
                </div>
                <div className="relative w-full sm:w-32">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-500">$</span>
                  <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} min="1" step="1" className={`${inputCls} !pl-8`} />
                </div>
                <button type="submit" disabled={!newName.trim() || addLoading} className="btn-brutal whitespace-nowrap">
                  ADD TO ROSTER
                </button>
              </form>
              
              <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-2">
                  ACTIVE ROSTER
                </div>
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-4 bg-slate-800/20 border border-slate-800 px-4 py-3 group">
                    <span className="font-display text-white text-lg uppercase tracking-wider flex-1">{p.name}</span>
                    
                    {editRates[p.id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-xs">$</span>
                          <input type="number" value={editRates[p.id]} onChange={e => setEditRates(prev => ({ ...prev, [p.id]: e.target.value }))} min="1" className="w-20 bg-black border border-slate-700 pl-6 pr-2 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-neon-green" />
                        </div>
                        <button onClick={() => saveRate(p.id)} className="font-mono text-xs text-neon-green hover:text-white">SAVE</button>
                        <button onClick={() => setEditRates(prev => { const n = { ...prev }; delete n[p.id]; return n })} className="font-mono text-xs text-slate-500 hover:text-white">X</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-400 text-xs">${p.rate}/EA</span>
                        <button onClick={() => setEditRates(prev => ({ ...prev, [p.id]: String(p.rate) }))} className="font-mono text-[10px] text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">[EDIT]</button>
                      </div>
                    )}
                    <button onClick={() => removeParticipant(p.id)} className="font-mono text-[10px] text-red-500 hover:text-red-400 transition-colors ml-2 opacity-0 group-hover:opacity-100">[REMOVE]</button>
                  </div>
                ))}
                {participants.length === 0 && <p className="font-mono text-xs text-center text-slate-600 py-8">[ ROSTER EMPTY ]</p>}
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
