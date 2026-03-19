import { motion, AnimatePresence } from 'framer-motion'

function timeAgo(ts) {
  if (!ts) return ''
  const now = Date.now()
  const then = ts.toMillis ? ts.toMillis() : new Date(ts).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function EntryFeed({ entries }) {
  return (
    <div className="w-full">
      <p className="text-slate-400 text-sm uppercase tracking-widest mb-4 font-semibold text-center">
        Recent Offences
      </p>
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {entries.slice(0, 20).map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center justify-between bg-slate-900/60 border border-slate-700/30 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🤬</span>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {entry.participantName}
                  </p>
                  {entry.note && (
                    <p className="text-slate-500 text-xs italic mt-0.5">"{entry.note}"</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-emerald-400 font-bold">${(entry.amount || 0).toFixed(2)}</p>
                <p className="text-slate-600 text-xs">{timeAgo(entry.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-center text-slate-600 py-8">
            No offences yet. Keep it clean! 🧼
          </div>
        )}
      </div>
    </div>
  )
}
