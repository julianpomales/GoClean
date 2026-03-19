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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!hasPin) {
        if (pin.length < 4) { setError('PIN must be at least 4 digits'); setLoading(false); return }
        if (pin !== confirmPin) { setError('PINs do not match'); setLoading(false); return }
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
        }
      }
    } catch (err) {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl"
        >
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h2 className="text-white text-xl font-bold mt-2">
              {hasPin ? 'Admin Access' : 'Create Admin PIN'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {hasPin ? 'Enter your PIN to access admin controls' : 'Set a PIN to protect admin controls'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">
                {hasPin ? 'PIN' : 'New PIN (min. 4 digits)'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••"
                autoFocus
              />
            </div>

            {!hasPin && (
              <div>
                <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••"
                />
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Verifying...' : hasPin ? 'Unlock' : 'Set PIN & Enter'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
