import { usePlayer } from '../context/PlayerContext.jsx'

function QueuePanel() {
  const { queue, removeFromQueue } = usePlayer()

  return (
    <section aria-label="Antrean lagu">
      {queue.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Antrean kosong. Tambahkan lagu dari playlist.</p>
      ) : (
        <ol className="space-y-2">
          {queue.map((song, index) => (
            <li key={`${song.id}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-950/50 p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{song.title}</span>
                <span className="block truncate text-sm text-slate-400">{song.artist}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFromQueue(song.id)}
                aria-label={`Hapus ${song.title} dari antrean`}
                className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Hapus
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default QueuePanel
