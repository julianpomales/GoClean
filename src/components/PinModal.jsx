import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

async function hashPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function PinModal({ onSuccess, onClose, hasPin }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!hasPin) {
        if (pin.length < 4) { setError('PIN must be at least 4 digits'); triggerShake(); setLoading(false); return }
        if (pin !== confirmPin) { setError('PINs do not match'); triggerShake(); setLoading(false); return }
        const hashed = await hashPin(pin)
        await setDoc(doc(db, 'settings', 'config'), { pinHash: hashed }, { merge: true })
        sessionStorage.setItem('gc_admin', '1')
        onSuccess()
      } else {
        const snap = await getDoc(doc(db, 'settings', 'config'))
        const stored = snap.data()?.pinHash
        const hashed = await hashPin(pin)
        if (hashed === stored) {
          sessionStorage.setItem('gc_admin', '1')
          onSuccess()
        } else {
          setError('Incorrect PIN')
          triggerShake()
          setPin('')
        }
      }
    } catch (err) {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  const inputClasses = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-200 placeholder-white/10'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{
            scale: 1, opacity: 1, y: 0,
            x: shake ? [0, -8, 8, -8, 8, 0] : 0,
          }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="glass rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl shadow-black/40"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{hasPin ? '🔐' : '🛡️'}</span>
            </div>
            <h2 className="text-white font-bold text-lg">
              {hasPin ? 'Enter Admin PIN' : 'Create Admin PIN'}
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              {hasPin
                ? 'Enter your PIN to unlock admin controls'
                : 'You\'re the first here! Set a PIN to manage this group.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block">
                {hasPin ? 'PIN' : 'Choose a PIN (min. 4 digits)'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={inputClasses}
                placeholder="••••"
                autoFocus
              />
            </div>

            {!hasPin && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 block">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className={inputClasses}
                  placeholder="••••"
                />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400/90 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Verifying...
                </span>
              ) : hasPin ? 'Unlock' : 'Set PIN & Enter'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-400 text-sm transition-colors"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
