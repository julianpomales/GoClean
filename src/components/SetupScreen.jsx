import { useState } from 'react'
import { motion } from 'framer-motion'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function SetupScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setError('')
    if (pin.length < 4) { setError('PIN REQUIRES MINIMUM 4 DIGITS'); return }
    if (pin !== confirmPin) { setError('PIN MISMATCH DETECTED'); return }
    if (!deadline) { setError('DEADLINE CONFIGURATION REQUIRED'); return }

    setLoading(true)
    try {
      const hashed = await hashPin(pin)
      const ts = Timestamp.fromDate(new Date(deadline))
      await setDoc(doc(db, 'settings', 'config'), {
        pinHash: hashed,
        deadline: ts,
      })
      sessionStorage.setItem('gc_admin', '1')
      if (onComplete) onComplete()
    } catch (err) {
      setError('SYSTEM ERROR. RETRY.')
    }
    setLoading(false)
  }

  const inputCls = 'w-full bg-[var(--color-card-bg)] border border-slate-700 rounded-none px-6 py-5 text-white font-mono focus:outline-none focus:border-neon-green transition-colors placeholder-slate-600'

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-slate-800/50 border border-slate-800/80 p-px"
      >
        <div className="bg-[var(--color-card-bg)] p-8 sm:p-12 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <span className="text-3xl">⚙️</span>
            <div>
              <h2 className="font-display font-bold text-2xl tracking-tighter uppercase text-white">
                System Config
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neon-green mt-1">
                INITIALIZATION PROTOCOL
              </p>
            </div>
          </div>

          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10 text-center">
              <div>
                <p className="font-display text-4xl uppercase tracking-tighter text-white mb-4">NO LEDGER DETECTED</p>
                <p className="font-mono text-sm text-slate-400 uppercase tracking-widest leading-relaxed">
                  You are the first operator to authenticate.
                  <br />Proceed to configure the initial competition parameters.
                </p>
              </div>
              <button onClick={() => setStep(1)} className="btn-brutal w-full">
                BEGIN CONFIGURATION
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(0)} className="font-mono text-slate-500 hover:text-white transition-colors">
                  [ BACK ]
                </button>
                <h3 className="font-mono text-sm uppercase tracking-widest text-white">STEP 1: ADMIN PIN</h3>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                    MASTER PIN (MIN 4 DIGITS)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className={`${inputCls} text-3xl tracking-[0.5em] text-center`}
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                    VERIFY PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className={`${inputCls} text-3xl tracking-[0.5em] text-center`}
                    placeholder="••••"
                  />
                </div>
                <button
                  onClick={() => {
                    if (pin.length < 4) { setError('PIN REQUIRES MINIMUM 4 DIGITS'); return }
                    if (pin !== confirmPin) { setError('PIN MISMATCH DETECTED'); return }
                    setError('')
                    setStep(2)
                  }}
                  disabled={pin.length < 4}
                  className="btn-brutal w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  PROCEED
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} className="font-mono text-slate-500 hover:text-white transition-colors">
                  [ BACK ]
                </button>
                <h3 className="font-mono text-sm uppercase tracking-widest text-white">STEP 2: TARGET DATE</h3>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3 block">
                    COMPETITION DEADLINE
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className={`${inputCls} text-xl`}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSetup}
                  disabled={!deadline || loading}
                  className="btn-brutal w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? 'INITIALIZING...' : 'INITIALIZE SYSTEM'}
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-500/10 border border-red-500/20 px-4 py-3"
            >
              <p className="font-mono text-red-500 text-xs text-center uppercase tracking-widest">
                {error}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
