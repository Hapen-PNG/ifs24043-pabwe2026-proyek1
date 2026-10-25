import { usePlayer } from '../context/PlayerContext.jsx'
import CoverArt from './CoverArt.jsx'
import ProgressBar from './ProgressBar.jsx'
import Visualizer from './Visualizer.jsx'
import VolumeControl from './VolumeControl.jsx'

function Player() {
  const {
    currentSong,
    isPlaying,
    playbackError,
    isShuffle,
    repeatMode,
    toggle,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()

  if (!currentSong) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        Belum ada lagu untuk diputar.
      </p>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {playbackError && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">
          {playbackError === 'File audio belum tersedia'
            ? playbackError
            : `Tidak dapat memutar audio: ${playbackError}`}
        </p>
      )}
      <CoverArt
        song={currentSong}
        className="relative mx-auto mb-8 aspect-square w-full max-w-xs shadow-2xl shadow-violet-950/30"
      />

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2">
        <Visualizer />
      </div>

      <div className="mb-6 text-center">
        <h3 className="truncate text-2xl font-bold tracking-tight text-white">
          {currentSong.title}
        </h3>
        <p className="mt-1 truncate text-sm text-slate-400">
          {currentSong.artist}
        </p>
      </div>

      <div className="mb-5">
        <ProgressBar />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleShuffle}
          aria-label="Acak lagu"
          aria-pressed={isShuffle}
          className={`rounded-full p-2 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${isShuffle ? 'text-violet-300' : 'text-slate-400 hover:text-white'}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m18 14 4 4-4 4" />
            <path d="M18 2l4 4-4 4" />
            <path d="M2 18h2.5a6 6 0 0 0 4.2-1.7L18 7" />
            <path d="M2 6h2.5a6 6 0 0 1 4.2 1.7l1.1 1.1" />
            <path d="M14.2 14.2l1.6 1.6A6 6 0 0 0 20 18h2" />
          </svg>
        </button>

        <button
          type="button"
          onClick={prev}
          aria-label="Lagu sebelumnya"
          className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M6 5h2v14H6zM19 6v12l-9-6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Jeda' : 'Putar'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-400 text-slate-950 shadow-lg shadow-violet-500/20 transition-all hover:scale-105 hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            {isPlaying ? (
              <path d="M7 5h4v14H7zM15 5h4v14h-4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Lagu berikutnya"
          className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M16 5h2v14h-2zM5 6v12l9-6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={cycleRepeat}
          aria-label={`Ulangi: ${repeatMode === 'one' ? 'satu lagu' : repeatMode === 'all' ? 'semua lagu' : 'mati'}`}
          aria-pressed={repeatMode !== 'off'}
          className={`relative rounded-full p-2 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${repeatMode !== 'off' ? 'text-violet-300' : 'text-slate-400 hover:text-white'}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11V9a3 3 0 0 1 3-3h15" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v2a3 3 0 0 1-3 3H3" />
            {repeatMode === 'one' && (
              <text
                x="9"
                y="14"
                fill="currentColor"
                stroke="none"
                fontSize="7"
                fontWeight="700"
              >
                1
              </text>
            )}
          </svg>
        </button>
      </div>

      <div className="mt-6 flex justify-end">
        <VolumeControl />
      </div>
    </div>
  )
}

export default Player
