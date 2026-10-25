import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import CoverArt from './CoverArt.jsx'

function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) return '--:--'

  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="equalizer-bar w-0.5 rounded-full bg-violet-300"
          style={{ animationDelay: `${bar * 120}ms` }}
        />
      ))}
    </span>
  )
}

function Playlist({
  songs: visibleSongs,
  favoriteIds = [],
  onToggleFavorite,
  onAddToQueue,
}) {
  const { songs: allSongs, currentSong, isPlaying, selectSong } = usePlayer()
  const songs = visibleSongs ?? allSongs
  const [durations, setDurations] = useState({})

  useEffect(() => {
    let cancelled = false
    const metadataPlayers = []

    allSongs.forEach(async (song) => {
      let response
      try {
        response = await fetch(song.src, { method: 'HEAD' })
      } catch {
        if (!cancelled) setDurations((current) => ({ ...current, [song.id]: null }))
        return
      }
      const isAudioResponse =
        response.ok &&
        response.headers.get('content-type')?.toLowerCase().startsWith('audio/') === true
      if (cancelled || !isAudioResponse) {
        if (!cancelled) setDurations((current) => ({ ...current, [song.id]: null }))
        return
      }

      const audio = new Audio()
      const handleLoadedMetadata = () => {
        setDurations((current) => ({
          ...current,
          [song.id]: audio.duration,
        }))
      }
      const handleError = () => {
        setDurations((current) => ({
          ...current,
          [song.id]: null,
        }))
      }

      audio.preload = 'metadata'
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('error', handleError)
      audio.src = song.src
      audio.load()
      metadataPlayers.push({ audio, handleLoadedMetadata, handleError })
    })

    return () => {
      cancelled = true
      metadataPlayers.forEach(({ audio, handleLoadedMetadata, handleError }) => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('error', handleError)
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      })
    }
  }, [allSongs])

  return (
    <ul className="mt-6 space-y-2">
      {songs.map((song) => {
        const isCurrentSong = currentSong?.id === song.id

        return (
          <li key={song.id}>
            <div
              className={`flex items-center gap-2 rounded-xl p-2 transition-colors duration-200 hover:bg-slate-800 ${
                isCurrentSong ? 'bg-violet-500/10 ring-1 ring-inset ring-violet-400/30' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => selectSong(song)}
                aria-current={isCurrentSong ? 'true' : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {isCurrentSong && isPlaying ? <Equalizer /> : (
                    <span className="text-xs font-medium text-slate-500">{String(song.id).padStart(2, '0')}</span>
                  )}
                </span>
                <CoverArt song={song} className="h-10 w-10 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${isCurrentSong ? 'text-violet-200' : 'text-white'}`}>
                    {song.title}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-400">{song.artist}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500">{formatTime(durations[song.id])}</span>
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(song.id)}
                  aria-label={`${favoriteIds.includes(song.id) ? 'Hapus dari' : 'Tambahkan ke'} lagu favorit: ${song.title}`}
                  aria-pressed={favoriteIds.includes(song.id)}
                  className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                    favoriteIds.includes(song.id) ? 'text-rose-400' : 'text-slate-500 hover:text-rose-300'
                  }`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill={favoriteIds.includes(song.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                  </svg>
                </button>
              )}
              {onAddToQueue && (
                <button
                  type="button"
                  onClick={() => onAddToQueue(song)}
                  aria-label={`Tambahkan ${song.title} ke antrean`}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span aria-hidden="true">＋</span>
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default Playlist
