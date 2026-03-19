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

const PLACEHOLDER = [
  { id: 'ph1', participantName: 'Alex', amount: 1, note: 'Spilled coffee', createdAt: { toMillis: () => Date.now() - 120000 } },
  { id: 'ph2', participantName: 'Jordan', amount: 1, note: '', createdAt: { toMillis: () => Date.now() - 600000 } },
  { id: 'ph3', participantName: 'Alex', amount: 1, note: 'Meeting interruption', createdAt: { toMillis: () => Date.now() - 3600000 } },
  { id: 'ph4', participantName: 'Morgan', amount: 1, note: '', createdAt: { toMillis: () => Date.now() - 7200000 } },
]

export default function EntryFeed({ entries }) {
  const isPlaceholder = entries.length === 0
  const data = isPlaceholder ? PLACEHOLDER : entries

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Recent Activity</span>
        {isPlaceholder && (
          <span className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">SAMPLE DATA</span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-slate-800/60 border border-slate-800/60">
        <AnimatePresence initial={false}>
          {data.slice(0, 20).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: isPlaceholder ? 0.35 : 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="group flex items-center gap-4 px-5 h-[72px] bg-[var(--color-card-bg)] hover:bg-slate-900/60 transition-colors overflow-hidden"
            >
              {/* Icon */}
              <div className="w-7 h-7 shrink-0 flex items-center justify-center border border-red-500/20 bg-red-500/5 text-red-400 font-mono text-xs">
                !
              </div>

              {/* Name + note */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-sm uppercase tracking-wide text-slate-200 truncate">{entry.participantName}</p>
                  <span className="font-mono text-[10px] text-slate-600 shrink-0">{timeAgo(entry.createdAt)}</span>
                </div>
                {entry.note && (
                  <p className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">&ldquo;{entry.note}&rdquo;</p>
                )}
              </div>

              {/* Amount */}
              <span className="font-mono text-sm font-bold text-red-400 shrink-0">+${(entry.amount || 0).toFixed(2)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
