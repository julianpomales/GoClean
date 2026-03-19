import { motion, AnimatePresence } from 'framer-motion'

const medals = ['🥇', '🥈', '🥉']

export default function Leaderboard({ participants }) {
  const sorted = [...participants].sort((a, b) => b.totalOwed - a.totalOwed)

  return (
    <div className="w-full">
      <p className="text-slate-400 text-sm uppercase tracking-widest mb-4 font-semibold text-center">
        Leaderboard
      </p>
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`flex items-center justify-between px-5 py-4 rounded-2xl border
                ${i === 0
                  ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border-yellow-700/40'
                  : i === 1
                  ? 'bg-gradient-to-r from-slate-700/30 to-slate-800/20 border-slate-600/40'
                  : i === 2
                  ? 'bg-gradient-to-r from-orange-900/20 to-amber-900/10 border-orange-700/30'
                  : 'bg-slate-900/60 border-slate-700/30'
                }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl w-8 text-center">
                  {medals[i] || <span className="text-slate-500 text-lg font-bold">{i + 1}</span>}
                </span>
                <div>
                  <p className="text-white font-semibold text-lg leading-tight">{p.name}</p>
                  <p className="text-slate-400 text-sm">
                    {p.swearCount || 0} swear{(p.swearCount || 0) !== 1 ? 's' : ''} · ${p.rate}/each
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${i === 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  ${(p.totalOwed || 0).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="text-center text-slate-600 py-8">
            No participants yet — add some from the admin panel.
          </div>
        )}
      </div>
    </div>
  )
}
