import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[70px] h-[80px] sm:w-[90px] sm:h-[100px] flex items-center justify-center border border-slate-800 bg-[var(--color-deep-bg)] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.02)]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-4xl sm:text-5xl font-mono text-white tracking-tighter"
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-[80px] sm:h-[100px]">
      <div className="flex flex-col gap-3">
        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
      </div>
    </div>
  )
}

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!deadline) return

    const calc = () => {
      const now = Date.now()
      const end = deadline.toMillis ? deadline.toMillis() : new Date(deadline).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      })
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  if (!deadline) {
    return (
      <div className="text-center w-full">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">[ TIMER_OFFLINE ]</div>
        <p className="font-display text-2xl text-slate-600">AWAITING TARGET DATE</p>
      </div>
    )
  }

  if (!timeLeft) return null

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center w-full"
      >
        <span className="text-5xl mb-6 block">🏁</span>
        <span className="font-display font-black text-4xl uppercase tracking-tighter text-red-500 block">
          COMPETITION CONCLUDED
        </span>
      </motion.div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-8 w-full text-center">
        [ TIME_REMAINING ]
      </p>
      <div className="flex items-start justify-center gap-3 sm:gap-6">
        <TimeUnit value={timeLeft.days} label="DAYS" />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="HRS" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="MINS" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="SECS" />
      </div>
    </div>
  )
}
