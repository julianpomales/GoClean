import { motion, AnimatePresence } from 'framer-motion'

const rankStyles = [
  { bg: 'from-yellow-500/10 to-amber-500/5', border: 'border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-300', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.08)]' },
  { bg: 'from-slate-400/10 to-slate-500/5', border: 'border-slate-400/20', badge: 'bg-slate-400/20 text-slate-300', glow: '' },
  { bg: 'from-orange-500/10 to-amber-500/5', border: 'border-orange-500/15', badge: 'bg-orange-500/20 text-orange-300', glow: '' },
]

const defaultStyle = { bg: 'from-white/[0.02] to-white/[0.01]', border: 'border-white/[0.04]', badge: 'bg-white/5 text-slate-500', glow: '' }

export default function Leaderboard({ participants }) {
  const sorted = [...participants].sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
          Leaderboard
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
      </div>

      <div className="flex flex-col gap-2.5">
        <AnimatePresence>
          {sorted.map((p, i) => {
            const s = rankStyles[i] || defaultStyle
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`group flex items-center justify-between px-5 py-4.5 rounded-2xl border bg-gradient-to-r transition-all duration-300 hover:scale-[1.01] ${s.bg} ${s.border} ${s.glow}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${s.badge}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white/90 font-semibold text-base leading-tight">{p.name}</p>
                    <p className="text-slate-500 text-sm mt-0.5">
                      {p.swearCount || 0} offence{(p.swearCount || 0) !== 1 ? 's' : ''} · ${p.rate}/ea
                    </p>
                  </div>
                </div>
                <span
                  className="text-2xl font-black tabular-nums text-white/90"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ${(p.totalOwed || 0).toFixed(2)}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl py-16 text-center"
          >
            <span className="text-4xl block mb-4">👥</span>
            <p className="text-slate-500 text-base">No participants yet</p>
            <p className="text-slate-600 text-sm mt-2">Unlock admin to add people</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
