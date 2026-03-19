import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function Particle({ x, color }) {
  const angle = Math.random() * 360
  const distance = 80 + Math.random() * 120
  const dx = Math.cos((angle * Math.PI) / 180) * distance
  const dy = Math.sin((angle * Math.PI) / 180) * distance - 100

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: dx, y: dy, opacity: 0, scale: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: x,
        top: '60%',
        width: 10,
        height: 10,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        backgroundColor: color,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  )
}

export default function Confetti({ trigger }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: `${20 + Math.random() * 60}%`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))

  return (
    <AnimatePresence>
      {trigger && particles.map(p => (
        <Particle key={`${trigger}-${p.id}`} x={p.x} color={p.color} />
      ))}
    </AnimatePresence>
  )
}
