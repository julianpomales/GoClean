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
    <div className="flex flex-col justify-center h-full py-8 px-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">
        TOTAL POOL
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-neon-green text-2xl font-mono leading-none select-none">$</span>
        <span className="text-[4.5rem] sm:text-[6rem] font-mono font-bold leading-none tracking-tighter text-white">
          <AnimatedDollar value={total} />
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 flex items-center gap-2"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${total > 0 ? 'bg-red-400 animate-pulse' : 'bg-slate-700'}`} />
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {total > 0 ? 'FUNDS ACCUMULATING' : 'NO INFRACTIONS YET'}
        </p>
      </motion.div>
    </div>
  )
}
