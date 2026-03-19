import { motion } from 'framer-motion'

export default function GroupHub({ user, groups, onSelect, onCreateNew, onJoinExisting }) {
  return (
    <div className="min-h-screen bg-grain flex flex-col relative overflow-hidden">
      {/* Grid lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white" />
        <div className="absolute top-0 bottom-0 left-2/4 w-px bg-white" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full py-8 px-6 sm:px-12 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tighter uppercase flex items-center gap-3">
          <span className="text-2xl">🧼</span> GOCLEAN
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          {user.displayName || user.email}
        </span>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 sm:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neon-green mb-4">
              OPERATOR AUTHENTICATED
            </p>
            <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter text-white">
              YOUR GROUPS
            </h1>
          </div>

          {/* Existing groups */}
          {groups.length > 0 && (
            <div className="flex flex-col gap-px bg-slate-800/50 border border-slate-800/80 p-px mb-6">
              {groups.map((g, i) => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelect(g)}
                  className="group flex items-center justify-between px-6 py-5 bg-[var(--color-card-bg)] hover:bg-slate-900/80 transition-colors text-left w-full"
                >
                  <div>
                    <p className="font-display text-xl uppercase tracking-wider text-white group-hover:text-neon-green transition-colors">
                      {g.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                      CODE: {g.code} &nbsp;·&nbsp; {g.memberCount || 0} MEMBER{g.memberCount !== 1 ? 'S' : ''}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-600 group-hover:text-neon-green transition-colors">
                    ENTER →
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {groups.length === 0 && (
            <div className="border border-slate-800/80 bg-[var(--color-card-bg)] py-12 text-center mb-6">
              <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
                NO GROUPS YET
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800/50 border border-slate-800/80 p-px">
            <button
              onClick={onCreateNew}
              className="group flex flex-col items-center justify-center gap-3 px-6 py-8 bg-[var(--color-card-bg)] hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-2xl text-slate-600 group-hover:text-neon-green transition-colors">+</span>
              <span className="font-display font-bold text-lg uppercase tracking-wider text-white">CREATE GROUP</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 text-center">
                Start a new swear jar
              </span>
            </button>
            <button
              onClick={onJoinExisting}
              className="group flex flex-col items-center justify-center gap-3 px-6 py-8 bg-[var(--color-card-bg)] hover:bg-slate-900/80 transition-colors"
            >
              <span className="font-mono text-2xl text-slate-600 group-hover:text-neon-green transition-colors">#</span>
              <span className="font-display font-bold text-lg uppercase tracking-wider text-white">JOIN GROUP</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 text-center">
                Enter a group code
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 px-6 sm:px-12 flex items-center justify-between border-t border-slate-800/50">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">GOCLEAN VERSION 2.0.0</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">SYSTEM ONLINE</span>
      </footer>
    </div>
  )
}
