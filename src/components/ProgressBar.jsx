import { usePlayer } from '../context/PlayerContext.jsx'

function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) return '00:00'

  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function ProgressBar() {
  const { currentTime, duration, seek } = usePlayer()

  return (
    <div className="w-full">
      <input
        aria-label="Posisi pemutaran"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-400 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={Math.min(currentTime, duration || 0)}
        onChange={(event) => seek(Number(event.target.value))}
        disabled={!duration}
      />
      <div className="mt-2 flex justify-between text-xs font-medium tabular-nums text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

export default ProgressBar
