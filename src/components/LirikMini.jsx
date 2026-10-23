import { useEffect, useMemo, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

function LirikMini() {
  const { currentSong, currentTime, seek } = usePlayer()
  const [isOpen, setIsOpen] = useState(false)
  const activeLineRef = useRef(null)
  const lyrics = currentSong?.lyrics ?? []
  const activeIndex = useMemo(() => {
    let active = -1
    lyrics.forEach((line, index) => {
      if (line.time <= currentTime) active = index
    })
    return active
  }, [currentTime, lyrics])
  const visibleLines = lyrics.length
    ? [activeIndex - 1, activeIndex, activeIndex + 1]
        .filter((index) => index >= 0 && index < lyrics.length)
        .map((index) => ({ ...lyrics[index], index }))
    : []

  useEffect(() => {
    if (!isOpen) return
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex, isOpen])

  const closeModal = (event) => {
    if (event.target === event.currentTarget) setIsOpen(false)
  }

  if (!lyrics.length) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Lirik</h2>
        <p className="mt-6 text-center text-sm text-slate-400">Lirik belum tersedia</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Lirik</h2>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-sm font-medium text-violet-300 transition-colors hover:text-violet-200 focus-visible:outline-none focus-visible:underline"
        >
          Lihat lirik lengkap
        </button>
      </div>
      <div className="mt-6 min-h-32 space-y-3 text-center" aria-live="polite">
        {visibleLines.map((line) => (
          <p
            key={`${line.time}-${line.index}`}
            className={`truncate transition-all duration-300 ${
              line.index === activeIndex
                ? 'scale-[1.02] text-lg font-bold text-white'
                : 'text-sm text-slate-500'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-lyrics-title"
            className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="full-lyrics-title" className="text-xl font-bold">Lirik lengkap</h2>
                <p className="mt-1 text-sm text-slate-400">{currentSong?.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup lirik lengkap"
                className="rounded-full p-2 text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </header>
            <ol className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto py-4 text-center">
              {lyrics.map((line, index) => {
                const active = index === activeIndex
                return (
                  <li key={`${line.time}-${index}`}>
                    <button
                      ref={active ? activeLineRef : null}
                      type="button"
                      onClick={() => seek(line.time)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full rounded-xl px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                        active ? 'font-bold text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {line.text}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>
      )}
    </section>
  )
}

export default LirikMini
