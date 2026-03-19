import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  collection, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

export default function AdminPanel({ participants, entries, deadline, onLock }) {
  const [activeTab, setActiveTab] = useState('log')

  // Log swear state
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [logLoading, setLogLoading] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)

  // Add participant state
  const [newName, setNewName] = useState('')
  const [newRate, setNewRate] = useState('1')
  const [addLoading, setAddLoading] = useState(false)

  // Edit rate state
  const [editRates, setEditRates] = useState({})

  // Deadline state
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
    { id: 'log', label: '🤬 Log Swear' },
    { id: 'people', label: '👥 People' },
    { id: 'entries', label: '📋 Entries' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-lg">🛡️</span>
          <span className="text-white font-bold">Admin Panel</span>
        </div>
        <button
          onClick={onLock}
          className="text-slate-400 hover:text-red-400 text-sm transition-colors flex items-center gap-1"
        >
          🔒 Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">

          {/* LOG SWEAR */}
          {activeTab === 'log' && (
            <motion.form
              key="log"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={logSwear}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Who swore?</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select person...</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.rate}/swear)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder='e.g. "Dropped their coffee"'
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedId || logLoading}
                className={`py-3 rounded-xl font-bold transition-all ${
                  logSuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white'
                }`}
              >
                {logSuccess ? '✓ Logged!' : logLoading ? 'Logging...' : '🤬 Log Swear'}
              </button>
            </motion.form>
          )}

          {/* PEOPLE */}
          {activeTab === 'people' && (
            <motion.div
              key="people"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <form onSubmit={addParticipant} className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    min="1"
                    step="1"
                    className="w-20 bg-slate-800 border border-slate-600 rounded-xl pl-6 pr-2 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newName.trim() || addLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Add
                </button>
              </form>

              <div className="flex flex-col gap-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
                    <span className="text-white text-sm font-medium flex-1">{p.name}</span>
                    {editRates[p.id] !== undefined ? (
                      <>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            value={editRates[p.id]}
                            onChange={e => setEditRates(prev => ({ ...prev, [p.id]: e.target.value }))}
                            min="1"
                            className="w-16 bg-slate-700 border border-slate-500 rounded-lg pl-5 pr-1 py-1 text-white text-xs focus:outline-none"
                          />
                        </div>
                        <button onClick={() => saveRate(p.id)} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">Save</button>
                        <button onClick={() => setEditRates(prev => { const n = { ...prev }; delete n[p.id]; return n })} className="text-slate-500 text-xs hover:text-slate-300">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 text-xs">${p.rate}/swear</span>
                        <button
                          onClick={() => setEditRates(prev => ({ ...prev, [p.id]: String(p.rate) }))}
                          className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                        >
                          ✏️
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="text-red-600 hover:text-red-400 text-xs transition-colors ml-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-4">No participants yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ENTRIES */}
          {activeTab === 'entries' && (
            <motion.div
              key="entries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 max-h-96 overflow-y-auto"
            >
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-white text-sm font-medium">{entry.participantName}</p>
                    {entry.note && <p className="text-slate-500 text-xs italic">"{entry.note}"</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-sm font-bold">${(entry.amount || 0).toFixed(2)}</span>
                    <button
                      onClick={() => deleteEntry(entry)}
                      className="text-red-600 hover:text-red-400 text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-slate-600 text-sm text-center py-4">No entries yet.</p>
              )}
            </motion.div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <motion.form
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={saveDeadline}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">
                  Competition End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!newDeadline || deadlineLoading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {deadlineLoading ? 'Saving...' : '💾 Save Deadline'}
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
