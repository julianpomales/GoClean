import { motion, AnimatePresence } from 'framer-motion'

const PLACEHOLDER = [
  { id: 'ph1', name: 'Alex', totalOwed: 14, swearCount: 14, rate: 1 },
  { id: 'ph2', name: 'Jordan', totalOwed: 9, swearCount: 9, rate: 1 },
  { id: 'ph3', name: 'Morgan', totalOwed: 6, swearCount: 6, rate: 1 },
  { id: 'ph4', name: 'Casey', totalOwed: 2, swearCount: 2, rate: 1 },
]

export default function Leaderboard({ participants }) {
  const isPlaceholder = participants.length === 0
  const data = isPlaceholder ? PLACEHOLDER : participants
  const sorted = [...data].sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))
  const max = sorted[0]?.totalOwed || 1

  return (
    <div className="w-full flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Leaderboard</span>
        {isPlaceholder && (
          <span className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">SAMPLE DATA</span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-slate-800/60 border border-slate-800/60">
        <AnimatePresence>
          {sorted.map((p, i) => {
            const isFirst = i === 0
            const pct = Math.round(((p.totalOwed || 0) / max) * 100)
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: isPlaceholder ? 0.35 : 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="relative group flex items-center gap-4 px-5 h-[72px] bg-[var(--color-card-bg)] hover:bg-slate-900/60 transition-colors overflow-hidden"
              >
                {/* Bar fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ${isFirst ? 'bg-neon-green/5' : 'bg-slate-800/30'}`}
                  style={{ width: `${pct}%` }}
                />

                {/* Rank */}
                <span className={`relative font-mono text-xs w-5 shrink-0 ${isFirst ? 'text-neon-green font-bold' : 'text-slate-600'}`}>
                  {i + 1}
                </span>

                {/* Avatar initial */}
                <div className={`relative w-8 h-8 shrink-0 flex items-center justify-center font-display font-black text-sm border ${
                  isFirst ? 'border-neon-green/50 text-neon-green bg-neon-green/5' : 'border-slate-800 text-slate-500 bg-transparent'
                }`}>
                  {p.name[0].toUpperCase()}
                </div>

                {/* Name + count */}
                <div className="relative flex-1 min-w-0">
                  <p className={`font-display text-base uppercase tracking-wide truncate ${
                    isFirst ? 'text-white font-bold' : 'text-slate-300'
                  }`}>{p.name}</p>
                  <p className="font-mono text-[10px] text-slate-600 mt-0.5">
                    {p.swearCount || 0}× · ${p.rate}/ea
                  </p>
                </div>

                {/* Amount */}
                <span className={`relative font-mono text-lg font-bold tracking-tight shrink-0 ${
                  isFirst ? 'text-neon-green' : 'text-slate-300'
                }`}>
                  ${(p.totalOwed || 0).toFixed(2)}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
