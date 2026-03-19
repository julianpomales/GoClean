import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function TimeUnit({ value, label }) {
  return (
    <motion.div
      key={value}
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 min-w-[70px] text-center shadow-lg">
        <span className="text-3xl md:text-4xl font-black text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-slate-500 text-xs uppercase tracking-widest mt-2 font-semibold">{label}</span>
    </motion.div>
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
      <div className="text-center text-slate-500 py-4">
        No deadline set — ask an admin to configure one.
      </div>
    )
  }

  if (!timeLeft) return null

  if (timeLeft.expired) {
    return (
      <div className="text-center py-4">
        <span className="text-2xl font-bold text-red-400">Competition has ended!</span>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <p className="text-slate-400 text-sm uppercase tracking-widest mb-4 font-semibold">
        Time Remaining
      </p>
      <div className="flex items-start justify-center gap-3 md:gap-6">
        <TimeUnit value={timeLeft.days} label="Days" />
        <span className="text-slate-600 text-3xl font-bold pt-3">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <span className="text-slate-600 text-3xl font-bold pt-3">:</span>
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <span className="text-slate-600 text-3xl font-bold pt-3">:</span>
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  )
}
