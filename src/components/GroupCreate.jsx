import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const inputCls = 'w-full bg-[var(--color-card-bg)] border border-slate-700 rounded-none px-6 py-4 text-white font-mono focus:outline-none focus:border-neon-green transition-colors placeholder-slate-600'

export default function GroupCreate({ user, onCreated, onBack }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setError('')
    if (!name.trim()) { setError('GROUP NAME REQUIRED'); return }
    if (pin.length < 4) { setError('PIN REQUIRES MINIMUM 4 DIGITS'); return }
    if (pin !== confirmPin) { setError('PIN MISMATCH DETECTED'); return }
    if (!deadline) { setError('DEADLINE REQUIRED'); return }

    setLoading(true)
    try {
      const code = generateCode()
      const hashed = await hashPin(pin)
      const groupRef = doc(collection(db, 'groups'))
      await setDoc(groupRef, {
        name: name.trim().toUpperCase(),
        code,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        pinHash: hashed,
        deadline: new Date(deadline),
        memberCount: 1,
        members: [user.uid],
      })
      sessionStorage.setItem('gc_admin', '1')
      onCreated({ id: groupRef.id, name: name.trim().toUpperCase(), code, pinHash: hashed, deadline: new Date(deadline) })
    } catch (err) {
      setError('SYSTEM ERROR. RETRY.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
      </div>

      <nav className="relative z-10 w-full py-8 px-6 sm:px-12 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tighter uppercase flex items-center gap-3">
          <span className="text-2xl">🧼</span> GOCLEAN
        </div>
        <button onClick={onBack} className="font-mono text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          [ BACK ]
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center relative z-10 px-6 sm:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          <div className="mb-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neon-green mb-4">NEW GROUP</p>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter text-white">
              CREATE LEDGER
            </h1>
          </div>

          <div className="bg-[var(--color-card-bg)] border border-slate-800/80 p-8 sm:p-10 flex flex-col gap-8">
            {/* Step 0: Name */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                GROUP NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                placeholder="E.G. OFFICE FLOOR 3"
                maxLength={40}
                autoFocus
              />
            </div>

            {/* PIN */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                ADMIN PIN (MIN 4 DIGITS)
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`${inputCls} text-2xl tracking-[0.4em] text-center`}
                placeholder="••••"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                CONFIRM PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`${inputCls} text-2xl tracking-[0.4em] text-center`}
                placeholder="••••"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                COMPETITION DEADLINE
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="font-mono text-red-500 text-xs uppercase tracking-widest bg-red-500/10 px-4 py-3 border border-red-500/20 text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || pin.length < 4 || !deadline}
              className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'INITIALIZING...' : 'CREATE GROUP'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
