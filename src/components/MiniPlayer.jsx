import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import CoverArt from './CoverArt.jsx'

function MiniPlayer() {
  const { currentSong, isPlaying, toggle, next } = usePlayer()
  if (!currentSong) return null

  return (
    <aside
      aria-label="Pemutar mini"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur sm:bottom-4"
    >
      <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
        <CoverArt
          song={currentSong}
          className="h-11 w-11 shrink-0 rounded-lg"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">
            {currentSong.title}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {currentSong.artist}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => toggle()}
        aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
        className="rounded-full p-2 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          {isPlaying ? (
            <path d="M7 5h4v14H7zM15 5h4v14h-4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>
      <button
        type="button"
        onClick={() => next()}
        aria-label="Lagu berikutnya"
        className="rounded-full p-2 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M16 5h2v14h-2zM5 6v12l9-6z" />
        </svg>
      </button>
    </aside>
  )
}

export default MiniPlayer
