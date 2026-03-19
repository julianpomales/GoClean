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
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (pin !== confirmPin) { setError('PINs do not match'); return }
    if (!deadline) { setError('Please set a deadline'); return }

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
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  const inputCls = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white/90 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-200 placeholder-white/10'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
            <span className="text-4xl">🧼</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">GoClean</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            The office swear jar competition.<br />Keep it clean or pay the price.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-3xl p-8"
        >
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-white font-bold text-lg mb-2">Welcome!</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Looks like no one has set up a group yet. Be the first to create one and become the admin.
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/15 text-sm"
              >
                Create a Group
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(0)} className="text-slate-500 hover:text-white transition-colors text-sm">←</button>
                <div>
                  <h2 className="text-white font-bold text-lg">Set Admin PIN</h2>
                  <p className="text-slate-500 text-xs">This PIN protects admin controls</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block">
                    PIN (min. 4 digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className={`${inputCls} text-center text-2xl tracking-[0.3em]`}
                    placeholder="••••"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className={`${inputCls} text-center text-2xl tracking-[0.3em]`}
                    placeholder="••••"
                  />
                </div>
                <button
                  onClick={() => {
                    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
                    if (pin !== confirmPin) { setError('PINs do not match'); return }
                    setError('')
                    setStep(2)
                  }}
                  disabled={pin.length < 4}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 disabled:shadow-none text-sm"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white transition-colors text-sm">←</button>
                <div>
                  <h2 className="text-white font-bold text-lg">Set Deadline</h2>
                  <p className="text-slate-500 text-xs">When does the competition end?</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSetup}
                  disabled={!deadline || loading}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 disabled:shadow-none text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Setting up...
                    </span>
                  ) : 'Launch GoClean 🚀'}
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400/90 text-sm text-center mt-4"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-8">
          Share the URL with your office to get everyone on board
        </p>
      </motion.div>
    </div>
  )
}
