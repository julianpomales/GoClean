import { motion, AnimatePresence } from 'framer-motion'

function timeAgo(ts) {
  if (!ts) return ''
  const now = Date.now()
  const then = ts.toMillis ? ts.toMillis() : new Date(ts).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function EntryFeed({ entries }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
          Recent Activity
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {entries.slice(0, 20).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-white/[0.02] transition-colors duration-200">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤬</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-white/85 font-medium text-base truncate">{entry.participantName}</p>
                    <span className="text-slate-700 text-xs flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                  </div>
                  {entry.note && (
                    <p className="text-slate-600 text-sm mt-0.5 truncate">"{entry.note}"</p>
                  )}
                </div>
                <span
                  className="text-base font-bold text-emerald-400/80 tabular-nums flex-shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  +${(entry.amount || 0).toFixed(0)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl py-16 text-center"
          >
            <span className="text-4xl block mb-4">🧼</span>
            <p className="text-slate-500 text-base">No offences recorded</p>
            <p className="text-slate-600 text-sm mt-2">Keep it clean, everyone!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
