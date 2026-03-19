import { useState, useEffect, useRef } from 'react'
import { collection, doc, onSnapshot, orderBy, query, getDocs, where, setDoc, getDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { db, auth } from './firebase'
import { motion, AnimatePresence } from 'framer-motion'
import CashPool from './components/CashPool'
import CountdownTimer from './components/CountdownTimer'
import Leaderboard from './components/Leaderboard'
import EntryFeed from './components/EntryFeed'
import AdminPanel from './components/AdminPanel'
import LogInfraction from './components/LogInfraction'
import PinModal from './components/PinModal'
import Confetti from './components/Confetti'
import LandingPage from './components/LandingPage'
import GroupHub from './components/GroupHub'
import GroupCreate from './components/GroupCreate'
import GroupJoin from './components/GroupJoin'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Group state
  const [screen, setScreen] = useState('hub') // hub | create | join | dashboard
  const [activeGroup, setActiveGroup] = useState(null)
  const [userGroups, setUserGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)

  // Dashboard state
  const [participants, setParticipants] = useState([])
  const [entries, setEntries] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const prevEntriesCount = useRef(0)
  const [mergeCandidate, setMergeCandidate] = useState(null) // { guestId, guestData }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
      if (!firebaseUser) {
        setActiveGroup(null)
        setScreen('hub')
        setIsAdmin(false)
      }
    })
    return unsub
  }, [])

  // Load user's groups when logged in
  useEffect(() => {
    if (!user) { setUserGroups([]); return }
    setGroupsLoading(true)
    const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid))
    const unsub = onSnapshot(q, snap => {
      setUserGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setGroupsLoading(false)
    })
    return unsub
  }, [user])

  const upsertParticipant = async (groupId) => {
    if (!user) return
    const myName = user.displayName || user.email.split('@')[0]
    const ref = doc(db, 'groups', groupId, 'participants', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      // Check for a guest doc with the same name (case-insensitive)
      const allSnap = await getDocs(collection(db, 'groups', groupId, 'participants'))
      const guest = allSnap.docs.find(d => {
        const data = d.data()
        return !data.uid && data.name?.toLowerCase() === myName.toLowerCase()
      })
      if (guest) {
        // Prompt merge — don't write yet, let user confirm
        setMergeCandidate({ guestId: guest.id, guestData: guest.data(), groupId, myName })
      } else {
        await setDoc(ref, {
          uid: user.uid,
          name: myName,
          photoURL: user.photoURL || null,
          email: user.email,
          rate: 1,
          totalOwed: 0,
          swearCount: 0,
        })
      }
    } else {
      await setDoc(ref, {
        name: myName,
        photoURL: user.photoURL || null,
        email: user.email,
      }, { merge: true })
    }
  }

  const handleMergeConfirm = async () => {
    if (!mergeCandidate || !user) return
    const { guestId, guestData, groupId, myName } = mergeCandidate
    const batch = writeBatch(db)
    // Create real account doc inheriting guest stats
    const realRef = doc(db, 'groups', groupId, 'participants', user.uid)
    batch.set(realRef, {
      uid: user.uid,
      name: myName,
      photoURL: user.photoURL || null,
      email: user.email,
      rate: guestData.rate || 1,
      totalOwed: guestData.totalOwed || 0,
      swearCount: guestData.swearCount || 0,
    })
    // Re-point all entries that referenced the guest to the real uid
    const entriesSnap = await getDocs(collection(db, 'groups', groupId, 'entries'))
    entriesSnap.docs.forEach(d => {
      if (d.data().participantId === guestId) {
        batch.update(d.ref, { participantId: user.uid, participantName: myName })
      }
    })
    // Delete guest doc
    batch.delete(doc(db, 'groups', groupId, 'participants', guestId))
    await batch.commit()
    setMergeCandidate(null)
  }

  const handleMergeSkip = async () => {
    if (!mergeCandidate || !user) return
    const { groupId, myName } = mergeCandidate
    const ref = doc(db, 'groups', groupId, 'participants', user.uid)
    await setDoc(ref, {
      uid: user.uid,
      name: myName,
      photoURL: user.photoURL || null,
      email: user.email,
      rate: 1,
      totalOwed: 0,
      swearCount: 0,
    })
    setMergeCandidate(null)
  }

  // Subscribe to participants — separate from entries so index errors don't affect it
  useEffect(() => {
    if (!activeGroup) return
    // Ensure current user is registered as a participant (catches pre-existing members)
    upsertParticipant(activeGroup.id)
    const pUnsub = onSnapshot(collection(db, 'groups', activeGroup.id, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => pUnsub()
  }, [activeGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to entries separately
  useEffect(() => {
    if (!activeGroup) return
    const q = query(collection(db, 'groups', activeGroup.id, 'entries'), orderBy('createdAt', 'desc'))
    const eUnsub = onSnapshot(q, snap => {
      const newEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (prevEntriesCount.current > 0 && newEntries.length > prevEntriesCount.current) {
        setConfettiTrigger(t => t + 1)
      }
      prevEntriesCount.current = newEntries.length
      setEntries(newEntries)
    }, err => console.warn('Entries subscription error (index may be building):', err))
    return () => eUnsub()
  }, [activeGroup])

  const handleSelectGroup = async (group) => {
    setActiveGroup(group)
    setIsAdmin(false)
    setScreen('dashboard')
    await upsertParticipant(group.id)
  }

  const handleGroupCreated = async (group) => {
    setActiveGroup(group)
    setIsAdmin(true)
    setScreen('dashboard')
    await upsertParticipant(group.id)
  }

  const handleGroupJoined = async (group) => {
    setActiveGroup(group)
    setIsAdmin(false)
    setScreen('dashboard')
    await upsertParticipant(group.id)
  }

  const handleLock = () => setIsAdmin(false)

  const handleLeaveGroup = () => {
    setActiveGroup(null)
    setParticipants([])
    setEntries([])
    setIsAdmin(false)
    setScreen('hub')
  }

  const handleSignOut = async () => {
    setActiveGroup(null)
    setIsAdmin(false)
    await signOut(auth)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-grain flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
          <span className="text-6xl animate-pulse">🧼</span>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">INITIALIZING SYSTEM...</span>
        </motion.div>
      </div>
    )
  }

  if (!user) return <LandingPage />

  if (screen === 'create') {
    return <GroupCreate user={user} onCreated={handleGroupCreated} onBack={() => setScreen('hub')} />
  }

  if (screen === 'join') {
    return <GroupJoin user={user} onJoined={handleGroupJoined} onBack={() => setScreen('hub')} />
  }

  if (screen === 'hub' || !activeGroup) {
    return (
      <GroupHub
        user={user}
        groups={userGroups}
        onSelect={handleSelectGroup}
        onCreateNew={() => setScreen('create')}
        onJoinExisting={() => setScreen('join')}
      />
    )
  }

  // Dashboard
  const totalPool = participants.reduce((sum, p) => sum + (p.totalOwed || 0), 0)
  const deadline = activeGroup.deadline

  return (
    <div className="min-h-screen bg-grain text-slate-200 font-sans selection:bg-neon-green selection:text-black flex flex-col">
      <Confetti trigger={confettiTrigger} />

      <AnimatePresence>
        {showPinModal && (
          <PinModal
            groupId={activeGroup.id}
            pinHash={activeGroup.pinHash}
            onSuccess={() => { setIsAdmin(true); setShowPinModal(false) }}
            onClose={() => setShowPinModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Grid Lines Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
        <div className="w-full max-w-5xl mx-auto h-full border-x border-white" />
      </div>

      {/* Header */}
      <header className="relative z-40 w-full py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handleLeaveGroup} className="font-mono text-[10px] text-slate-600 hover:text-white transition-colors uppercase tracking-widest shrink-0">
            ← GROUPS
          </button>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <h1 className="font-display font-black text-xl tracking-tight uppercase leading-none text-white">
              {activeGroup.name}
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              CODE: {activeGroup.code} &nbsp;·&nbsp; {user.displayName || user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-800/50 sm:border-0 pt-4 sm:pt-0">
          <button
            onClick={() => { if (!isAdmin) setShowPinModal(true) }}
            className={`font-mono text-xs uppercase tracking-widest transition-colors ${
              isAdmin ? 'text-neon-green' : 'text-slate-500 hover:text-white'
            }`}
          >
            [{isAdmin ? 'ADMIN ACTIVE' : 'AUTH ADMIN'}]
          </button>
          <button onClick={handleSignOut} title="Sign out" className="group relative shrink-0">
            <div className="relative w-10 h-10">
              {user.photoURL?.trim() && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="absolute inset-0 w-10 h-10 rounded-none border border-slate-800 group-hover:border-neon-green transition-colors grayscale group-hover:grayscale-0 object-cover"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div className="w-10 h-10 bg-[var(--color-card-bg)] border border-slate-800 flex items-center justify-center font-display font-bold text-sm text-slate-400 group-hover:text-neon-green group-hover:border-neon-green transition-colors">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            </div>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full py-6">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 flex flex-col gap-6">

          {/* ── Hero: big centered dollar + countdown underneath ── */}
          <div className="relative w-full border border-slate-800/70 bg-[var(--color-card-bg)] flex flex-col items-center justify-center px-8 py-0 gap-0 overflow-hidden">
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white" />
            </div>
            <CashPool total={totalPool} />
            <div className="w-full border-t border-slate-800/60 py-10">
              <CountdownTimer deadline={deadline} />
            </div>
          </div>

          {/* ── Merge prompt ── */}
          <AnimatePresence>
            {mergeCandidate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 16 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 16 }}
                  className="w-full max-w-md bg-[var(--color-card-bg)] border border-neon-green/40 p-8 flex flex-col gap-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="font-mono text-xs text-neon-green uppercase tracking-widest">ACCOUNT MATCH DETECTED</span>
                  </div>
                  <div>
                    <p className="font-display text-white text-lg uppercase tracking-wide">
                      A guest named <span className="text-neon-green">&ldquo;{mergeCandidate.guestData.name}&rdquo;</span> already exists in this group.
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-3">
                      Merge to inherit their record: {mergeCandidate.guestData.swearCount || 0} infractions · ${(mergeCandidate.guestData.totalOwed || 0).toFixed(2)} owed · ${(mergeCandidate.guestData.rate || 1).toFixed(2)}/infraction rate
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleMergeConfirm} className="btn-brutal flex-1">
                      MERGE — THAT'S ME
                    </button>
                    <button onClick={handleMergeSkip} className="flex-1 font-mono text-xs uppercase tracking-widest text-slate-500 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors px-4 py-3">
                      NOT ME
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Log infraction — all users ── */}
          <LogInfraction groupId={activeGroup.id} participants={participants} />

          {/* ── Admin panel ── */}
          <AnimatePresence>
            {isAdmin && (
              <AdminPanel
                groupId={activeGroup.id}
                participants={participants}
                entries={entries}
                deadline={deadline}
                onLock={handleLock}
              />
            )}
          </AnimatePresence>

          {/* ── Bottom: leaderboard + feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="border border-slate-800/70 px-8 py-8"
            >
              <Leaderboard participants={participants} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="border border-slate-800/70 px-8 py-8"
            >
              <EntryFeed entries={entries} />
            </motion.div>
          </div>

        </div>
      </main>

      <footer className="relative z-10 w-full py-8 px-6 sm:px-12 flex items-center justify-between border-t border-slate-800/50 mt-10 sm:mt-20">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">GOCLEAN VERSION 2.0.0</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">KEEP IT CLEAN 🧼</span>
      </footer>
    </div>
  )
}

export default App
