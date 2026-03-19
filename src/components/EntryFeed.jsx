import { motion, AnimatePresence } from 'framer-motion'

function timeAgo(ts) {
  if (!ts) return ''
  const now = Date.now()
  const then = ts.toMillis ? ts.toMillis() : new Date(ts).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 5) return 'JUST NOW'
  if (diff < 60) return `${diff}S AGO`
  if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`
  if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`
  return `${Math.floor(diff / 86400)}D AGO`
}

export default function EntryFeed({ entries }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 shrink-0">
          [ RECENT_ACTIVITY ]
        </p>
        <div className="h-px w-full bg-slate-800" />
      </div>

      <div className="flex flex-col gap-px bg-slate-800/50 border border-slate-800/80 p-px">
        <AnimatePresence initial={false}>
          {entries.slice(0, 20).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="group bg-[var(--color-card-bg)] hover:bg-slate-900/50 transition-colors overflow-hidden"
            >
              <div className="flex items-start gap-4 sm:gap-6 px-6 py-5">
                <div className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 font-mono text-sm shrink-0 border border-red-500/20">
                  !
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[32px]">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <p className="font-display text-lg uppercase tracking-wider text-slate-200 truncate">
                      {entry.participantName}
                    </p>
                    <span className="font-mono text-[10px] text-slate-500 tracking-widest shrink-0">
                      [{timeAgo(entry.createdAt)}]
                    </span>
                  </div>
                  {entry.note && (
                    <p className="font-mono text-xs text-slate-400 mt-2 truncate max-w-sm">
                      <span className="text-slate-600 mr-2">&gt;</span>"{entry.note}"
                    </p>
                  )}
                </div>
                <span className="font-mono text-lg text-red-400 shrink-0 flex items-center h-8">
                  +${(entry.amount || 0).toFixed(0)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="bg-[var(--color-card-bg)] py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              [ NO_ACTIVITY_LOGGED ]
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
