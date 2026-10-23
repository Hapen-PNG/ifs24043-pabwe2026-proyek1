import { usePlayer } from '../context/PlayerContext.jsx'

function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer()

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
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
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          {isMuted || volume === 0 ? (
            <>
              <path d="m17 9 5 6" />
              <path d="m22 9-5 6" />
            </>
          ) : (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </>
          )}
        </svg>
      </button>
      <input
        aria-label="Volume"
        className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-400 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={(event) => setVolume(Number(event.target.value))}
      />
    </div>
  )
}

export default VolumeControl
