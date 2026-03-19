import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

function AnimatedDollar({ value }) {
  const motionVal = useMotionValue(0)
  const display = useTransform(motionVal, v => v.toFixed(2))

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [value, motionVal])

  return <motion.span>{display}</motion.span>
}

export default function CashPool({ total }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative text-center py-6"
    >
      {/* Glow behind the number */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <p className="relative text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-5">
        Cash Pool
      </p>

      <div className="relative flex items-baseline justify-center">
        <span className="text-emerald-400/60 text-5xl md:text-6xl font-bold mr-2 select-none">$</span>
        <span
          className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-white"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <AnimatedDollar value={total} />
        </span>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative text-slate-600 text-sm mt-4 tracking-wide"
      >
        {total > 0 ? 'and counting...' : 'Squeaky clean so far'}
      </motion.p>
    </motion.div>
  )
}
