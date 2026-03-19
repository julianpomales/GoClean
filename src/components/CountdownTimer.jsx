import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Digit({ value, tv }) {
  const boxCls = tv
    ? 'w-[60px] h-[80px] sm:w-[96px] sm:h-[120px] lg:w-[140px] lg:h-[180px]'
    : 'w-[34px] h-[50px] sm:w-[60px] sm:h-[80px] lg:w-[96px] lg:h-[120px]'
  const textCls = tv
    ? 'text-5xl sm:text-7xl lg:text-9xl'
    : 'text-2xl sm:text-4xl lg:text-6xl'
  const yAmt = tv ? 24 : 16
  return (
    <div className={`relative ${boxCls} flex items-center justify-center overflow-hidden border border-slate-800 bg-[var(--color-deep-bg)]`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: yAmt, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -yAmt, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`${textCls} font-mono text-white tracking-tighter absolute`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function TimeUnit({ value, label, tv }) {
  const padded = String(value).padStart(2, '0')
  const labelCls = tv ? 'text-xs sm:text-sm' : 'text-[9px] sm:text-xs'
  const gapCls = tv ? 'gap-3 sm:gap-5' : 'gap-2 sm:gap-4'
  const digitGap = tv ? 'gap-2 sm:gap-3' : 'gap-1 sm:gap-2'
  return (
    <div className={`flex flex-col items-center ${gapCls}`}>
      <div className={`flex ${digitGap}`}>
        <Digit value={padded[0]} tv={tv} />
        <Digit value={padded[1]} tv={tv} />
      </div>
      <span className={`font-mono ${labelCls} uppercase tracking-widest text-slate-500`}>
        {label}
      </span>
    </div>
  )
}

function Separator({ tv }) {
  const hCls = tv
    ? 'h-[80px] sm:h-[120px] lg:h-[180px]'
    : 'h-[50px] sm:h-[80px] lg:h-[120px]'
  const dotCls = tv ? 'w-2 h-2' : 'w-1.5 h-1.5'
  return (
    <div className={`flex flex-col items-center justify-center ${hCls}`}>
      <div className="flex flex-col gap-2">
        <div className={`${dotCls} bg-slate-700 rounded-full`} />
        <div className={`${dotCls} bg-slate-700 rounded-full`} />
      </div>
    </div>
  )
}

export default function CountdownTimer({ deadline, tv = false }) {
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

  const outerGap = tv ? 'gap-8' : 'gap-5'
  const unitGap = tv ? 'gap-4 sm:gap-8 lg:gap-12' : 'gap-2 sm:gap-5 lg:gap-8'
  const labelSize = tv ? 'text-xs sm:text-sm' : 'text-[10px]'

  return (
    <div className={`flex flex-col items-center justify-center w-full ${outerGap}`}>
      <p className={`font-mono ${labelSize} uppercase tracking-[0.3em] text-slate-500`}>
        TIME REMAINING
      </p>
      <div className={`flex items-start ${unitGap}`}>
        <TimeUnit value={timeLeft.days} label="DAYS" tv={tv} />
        <Separator tv={tv} />
        <TimeUnit value={timeLeft.hours} label="HRS" tv={tv} />
        <Separator tv={tv} />
        <TimeUnit value={timeLeft.minutes} label="MINS" tv={tv} />
        <Separator tv={tv} />
        <TimeUnit value={timeLeft.seconds} label="SECS" tv={tv} />
      </div>
    </div>
  )
}
