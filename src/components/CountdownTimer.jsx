import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative glass rounded-2xl w-[80px] h-[88px] md:w-[90px] md:h-[100px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-4xl font-black text-white tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-[88px] md:h-[100px]">
      <div className="flex flex-col gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
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
      <div className="text-center py-8">
        <p className="text-slate-500 text-base">No deadline set yet</p>
        <p className="text-slate-600 text-sm mt-2">An admin can configure the competition end date</p>
      </div>
    )
  }

  if (!timeLeft) return null

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-6"
      >
        <span className="text-3xl mb-2 block">🏁</span>
        <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          Time's up!
        </span>
      </motion.div>
    )
  }

  return (
    <div className="text-center py-2">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-6">
        Time Remaining
      </p>
      <div className="flex items-start justify-center gap-3 md:gap-5">
        <TimeUnit value={timeLeft.days} label="Days" />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  )
}
