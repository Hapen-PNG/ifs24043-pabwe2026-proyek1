import { usePlayer } from '../context/PlayerContext.jsx'

function RecentlyPlayed({ songs }) {
  const { selectSong } = usePlayer()

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-lg font-semibold">Terakhir Diputar</h2>
      {songs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Belum ada lagu yang diputar.</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {songs.map((song) => (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => selectSong(song)}
                className="w-full truncate rounded-xl bg-slate-950/50 p-3 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {song.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecentlyPlayed
