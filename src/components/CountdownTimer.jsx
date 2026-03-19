import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Digit({ value }) {
  return (
    <div className="relative w-[28px] h-[44px] sm:w-[34px] sm:h-[52px] flex items-center justify-center overflow-hidden border border-slate-800 bg-[var(--color-deep-bg)]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl sm:text-2xl font-mono text-white tracking-tighter absolute"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function TimeUnit({ value, label }) {
  const padded = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1">
        <Digit value={padded[0]} />
        <Digit value={padded[1]} />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-[44px] sm:h-[52px]">
      <div className="flex flex-col gap-2">
        <div className="w-1 h-1 bg-slate-700 rounded-full" />
        <div className="w-1 h-1 bg-slate-700 rounded-full" />
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
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">TIME REMAINING</p>
        <p className="font-mono text-sm text-slate-700 uppercase tracking-widest">NO DEADLINE SET</p>
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
    <div className="flex flex-col items-center justify-center w-full gap-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
        TIME REMAINING
      </p>
      <div className="flex items-start gap-2 sm:gap-3">
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
