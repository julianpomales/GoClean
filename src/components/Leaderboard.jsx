import { motion, AnimatePresence } from 'framer-motion'

export default function Leaderboard({ participants }) {
  const sorted = [...participants].sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 shrink-0">
          [ LEADERBOARD ]
        </p>
        <div className="h-px w-full bg-slate-800" />
      </div>

      <div className="flex flex-col gap-px bg-slate-800/50 border border-slate-800/80 p-px">
        <AnimatePresence>
          {sorted.map((p, i) => {
            const isFirst = i === 0
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`group flex items-center justify-between px-6 py-5 bg-[var(--color-card-bg)] transition-colors hover:bg-slate-900/50 ${
                  isFirst ? 'border-l-2 border-neon-green' : 'border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`font-mono text-lg ${isFirst ? 'text-neon-green font-bold' : 'text-slate-600'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className={`font-display text-xl uppercase tracking-wider ${isFirst ? 'text-white font-bold' : 'text-slate-300'}`}>
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                      {p.swearCount || 0} INFRACTION{(p.swearCount || 0) !== 1 ? 'S' : ''} // ${p.rate}/EA
                    </p>
                  </div>
                </div>
                <span className={`font-mono text-2xl tracking-tighter ${isFirst ? 'text-neon-green' : 'text-white'}`}>
                  ${(p.totalOwed || 0).toFixed(2)}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="bg-[var(--color-card-bg)] py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              [ NO_DATA_FOUND ]
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
