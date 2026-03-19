import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  collection, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const inputCls = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-200 placeholder-white/15'
const btnPrimary = 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 disabled:shadow-none text-sm'
const labelCls = 'text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block'

export default function AdminPanel({ participants, entries, deadline, onLock }) {
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
    await addDoc(collection(db, 'entries'), {
      participantId: selectedId,
      participantName: participant.name,
      amount,
      note: note.trim(),
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'participants', selectedId), {
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
    await addDoc(collection(db, 'participants'), {
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
    await deleteDoc(doc(db, 'participants', id))
    const toDelete = entries.filter(e => e.participantId === id)
    await Promise.all(toDelete.map(e => deleteDoc(doc(db, 'entries', e.id))))
  }

  const saveRate = async (id) => {
    const rate = parseFloat(editRates[id])
    if (isNaN(rate) || rate <= 0) return
    await updateDoc(doc(db, 'participants', id), { rate })
    setEditRates(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const deleteEntry = async (entry) => {
    const participant = participants.find(p => p.id === entry.participantId)
    await deleteDoc(doc(db, 'entries', entry.id))
    if (participant) {
      await updateDoc(doc(db, 'participants', entry.participantId), {
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
    await setDoc(doc(db, 'settings', 'config'), { deadline: ts }, { merge: true })
    setDeadlineLoading(false)
  }

  const tabs = [
    { id: 'log', label: 'Log Swear', icon: '🤬' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'entries', label: 'History', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-xs">🛡️</span>
          </div>
          <span className="text-white/90 font-semibold text-sm">Admin Panel</span>
        </div>
        <button
          onClick={onLock}
          className="text-slate-600 hover:text-red-400 text-xs font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
        >
          <span className="text-[10px]">🔒</span> Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.04] px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-3 text-[11px] font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span> {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-tab-indicator"
                className="absolute bottom-0 inset-x-2 h-0.5 bg-emerald-400 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">

          {activeTab === 'log' && (
            <motion.form key="log" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} onSubmit={logSwear} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Who swore?</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls}>
                  <option value="">Select person...</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.rate}/swear)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder='e.g. "Dropped their coffee"' className={inputCls} />
              </div>
              <button type="submit" disabled={!selectedId || logLoading} className={logSuccess ? 'bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm' : `${btnPrimary} ${!logSuccess && !logLoading ? '!from-red-600 !to-red-500 hover:!from-red-500 hover:!to-red-400 !shadow-red-500/10' : ''}`}>
                {logSuccess ? '✓ Logged!' : logLoading ? 'Logging...' : '🤬 Log Swear'}
              </button>
            </motion.form>
          )}

          {activeTab === 'people' && (
            <motion.div key="people" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
              <form onSubmit={addParticipant} className="flex gap-2">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className={`flex-1 ${inputCls}`} />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} min="1" step="1" className={`w-20 !pl-6 ${inputCls}`} />
                </div>
                <button type="submit" disabled={!newName.trim() || addLoading} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all">
                  Add
                </button>
              </form>
              <div className="flex flex-col gap-1.5">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl px-3.5 py-2.5 transition-colors">
                    <span className="text-white/80 text-sm font-medium flex-1">{p.name}</span>
                    {editRates[p.id] !== undefined ? (
                      <>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">$</span>
                          <input type="number" value={editRates[p.id]} onChange={e => setEditRates(prev => ({ ...prev, [p.id]: e.target.value }))} min="1" className="w-14 bg-white/[0.05] border border-white/10 rounded-lg pl-5 pr-1 py-1 text-white text-xs focus:outline-none" />
                        </div>
                        <button onClick={() => saveRate(p.id)} className="text-emerald-400 text-xs font-semibold hover:text-emerald-300">Save</button>
                        <button onClick={() => setEditRates(prev => { const n = { ...prev }; delete n[p.id]; return n })} className="text-slate-600 text-xs hover:text-slate-400">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 text-xs font-medium">${p.rate}/ea</span>
                        <button onClick={() => setEditRates(prev => ({ ...prev, [p.id]: String(p.rate) }))} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">✏️</button>
                      </>
                    )}
                    <button onClick={() => removeParticipant(p.id)} className="text-slate-700 hover:text-red-400 text-xs transition-colors ml-0.5">✕</button>
                  </div>
                ))}
                {participants.length === 0 && <p className="text-slate-600 text-sm text-center py-6">No participants yet. Add some above.</p>}
              </div>
            </motion.div>
          )}

          {activeTab === 'entries' && (
            <motion.div key="entries" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] rounded-xl px-3.5 py-2.5 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 text-sm font-medium truncate">{entry.participantName}</p>
                    {entry.note && <p className="text-slate-600 text-xs truncate">"{entry.note}"</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-emerald-400/80 text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${(entry.amount || 0).toFixed(0)}</span>
                    <button onClick={() => deleteEntry(entry)} className="text-slate-700 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </div>
              ))}
              {entries.length === 0 && <p className="text-slate-600 text-sm text-center py-6">No entries yet.</p>}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.form key="settings" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} onSubmit={saveDeadline} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Competition End Date & Time</label>
                <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className={inputCls} />
              </div>
              <button type="submit" disabled={!newDeadline || deadlineLoading} className={btnPrimary}>
                {deadlineLoading ? 'Saving...' : 'Save Deadline'}
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
