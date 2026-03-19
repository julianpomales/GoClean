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

export default function CashPool({ total, tv = false }) {
  const amtCls = tv
    ? 'text-[10rem] sm:text-[14rem] lg:text-[18rem] xl:text-[22rem]'
    : 'text-[6rem] sm:text-[9rem] lg:text-[11rem]'
  const labelCls = tv ? 'text-xs sm:text-sm' : 'text-[10px]'
  const padCls = tv ? 'py-16 sm:py-24' : 'py-16 sm:py-20'
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${padCls}`}>
      <p className={`font-mono ${labelCls} uppercase tracking-[0.3em] text-slate-500 mb-6`}>
        TOTAL POOL
      </p>
      <div className="flex items-center gap-3">
        <span className={`text-neon-green ${amtCls} font-mono font-bold leading-none select-none`}>$</span>
        <span className={`${amtCls} font-mono font-bold leading-none tracking-tighter text-white`}>
          <AnimatedDollar value={total} />
        </span>
      </div>
    </div>
  )
}
