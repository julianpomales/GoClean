import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

function AnimatedNumber({ value }) {
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, v => v.toFixed(2))
  const displayRef = useRef(null)

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [value, motionVal])

  return (
    <motion.span>
      {rounded}
    </motion.span>
  )
}

export default function CashPool({ total }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-8"
    >
      <p className="text-slate-400 text-sm uppercase tracking-widest mb-2 font-semibold">
        Total Cash Pool
      </p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          $<AnimatedNumber value={total} />
        </span>
      </div>
      <p className="text-slate-500 text-sm mt-2">and counting...</p>
    </motion.div>
  )
}
