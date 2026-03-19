import { useEffect } from 'react'
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
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-8">
        [ POOL_TOTAL ]
      </p>

      <div className="flex items-baseline justify-center">
        <span className="text-neon-green text-3xl sm:text-4xl font-mono mr-2 select-none">$</span>
        <span className="text-[5rem] sm:text-[7rem] md:text-[9rem] font-mono font-bold leading-none tracking-tighter text-white">
          <AnimatedDollar value={total} />
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex items-center gap-3"
      >
        <span className={`w-2 h-2 rounded-full ${total > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          {total > 0 ? 'FUNDS ACCUMULATING' : 'ZERO INFRACTIONS'}
        </p>
      </motion.div>
    </div>
  )
}
