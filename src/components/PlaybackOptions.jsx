import { usePlayer } from '../context/PlayerContext.jsx'

const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]

function PlaybackOptions({ remainingSeconds, startTimer, cancelTimer }) {
  const { playbackRate, setPlaybackRate } = usePlayer()
  const formatCountdown = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <label className="flex items-center gap-3 text-sm text-slate-300">
        Kecepatan
        <select
          value={playbackRate}
          onChange={(event) => setPlaybackRate(Number(event.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          {rates.map((rate) => <option key={rate} value={rate}>{rate}x</option>)}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-slate-300">Sleep timer</span>
        {remainingSeconds > 0 ? (
          <>
            <span role="timer" aria-live="off" className="rounded-lg bg-violet-500/15 px-3 py-2 font-mono text-sm text-violet-200">
              {formatCountdown(remainingSeconds)}
            </span>
            <button type="button" onClick={cancelTimer} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              Batal
            </button>
          </>
        ) : (
          [15, 30, 60].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => startTimer(minutes)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {minutes} mnt
            </button>
          ))
        )}
      </div>
    </section>
  )
}

export default PlaybackOptions
