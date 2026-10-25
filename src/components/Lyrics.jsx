import { useEffect, useMemo, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

function Lyrics() {
  const { currentSong, currentTime, seek } = usePlayer()
  const activeLineRef = useRef(null)
  const lyrics = currentSong?.lyrics ?? []

  const activeIndex = useMemo(() => {
    let index = -1
    lyrics.forEach((line, lineIndex) => {
      if (line.time <= currentTime) index = lineIndex
    })
    return index
  }, [currentTime, lyrics])

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [activeIndex, currentSong?.id])

  if (!currentSong) {
    return <p className="text-sm text-slate-400">Belum ada lagu dipilih.</p>
  }

  if (lyrics.length === 0) {
    return <p className="text-sm text-slate-400">Lirik belum tersedia.</p>
  }

  return (
    <div
      aria-label={`Lirik ${currentSong.title}`}
      className="max-h-96 overflow-y-auto rounded-2xl bg-slate-950/50 px-4 py-8 text-center [scrollbar-color:#475569_transparent] [scrollbar-width:thin]"
    >
      <ol className="space-y-5">
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex

          return (
            <li key={`${line.time}-${index}`}>
              <button
                ref={isActive ? activeLineRef : null}
                type="button"
                onClick={() => seek(line.time)}
                aria-current={isActive ? 'true' : undefined}
                className={`w-full rounded-lg px-3 py-1 text-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  isActive
                    ? 'scale-[1.02] font-bold text-white'
                    : 'font-medium text-slate-500 hover:text-slate-300'
                }`}
              >
                {line.text}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default Lyrics
