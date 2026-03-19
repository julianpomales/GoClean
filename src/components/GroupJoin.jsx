import { useState } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, getDocs, updateDoc, arrayUnion, increment } from 'firebase/firestore'
import { db } from '../firebase'

async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const inputCls = 'w-full bg-[var(--color-card-bg)] border border-slate-700 rounded-none px-6 py-4 text-white font-mono focus:outline-none focus:border-neon-green transition-colors placeholder-slate-600'

export default function GroupJoin({ user, onJoined, onBack }) {
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setError('')
    const trimmedCode = code.trim().toUpperCase()
    if (trimmedCode.length !== 6) { setError('CODE MUST BE 6 CHARACTERS'); return }
    if (pin.length < 4) { setError('PIN REQUIRED'); return }

    setLoading(true)
    try {
      const q = query(collection(db, 'groups'), where('code', '==', trimmedCode))
      const snap = await getDocs(q)

      if (snap.empty) { setError('GROUP NOT FOUND — CHECK YOUR CODE'); setLoading(false); return }

      const groupDoc = snap.docs[0]
      const groupData = groupDoc.data()

      const hashed = await hashPin(pin)
      if (hashed !== groupData.pinHash) {
        setError('INCORRECT PIN')
        setPin('')
        setLoading(false)
        return
      }

      if (!groupData.members?.includes(user.uid)) {
        await updateDoc(groupDoc.ref, {
          members: arrayUnion(user.uid),
          memberCount: increment(1),
        })
      }

      onJoined({
        id: groupDoc.id,
        ...groupData,
        deadline: groupData.deadline?.toDate ? groupData.deadline.toDate() : groupData.deadline,
      })
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
            <p className="font-mono text-[10px] uppercase tracking-widest text-neon-green mb-4">EXISTING GROUP</p>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter text-white">
              JOIN LEDGER
            </h1>
          </div>

          <div className="bg-[var(--color-card-bg)] border border-slate-800/80 p-8 sm:p-10 flex flex-col gap-8">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                GROUP CODE (6 CHARACTERS)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                className={`${inputCls} text-2xl tracking-[0.5em] text-center uppercase`}
                placeholder="XXXXXX"
                autoFocus
                maxLength={6}
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                GROUP PIN
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

            {error && (
              <p className="font-mono text-red-500 text-xs uppercase tracking-widest bg-red-500/10 px-4 py-3 border border-red-500/20 text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || code.length !== 6 || pin.length < 4}
              className="btn-brutal w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'VERIFYING...' : 'JOIN GROUP'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
