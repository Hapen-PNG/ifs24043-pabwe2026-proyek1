import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

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

function Playlist() {
  const { songs, currentSong, isPlaying, selectSong } = usePlayer()
  const [durations, setDurations] = useState({})

  useEffect(() => {
    const metadataPlayers = songs.map((song) => {
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

      return { audio, handleLoadedMetadata, handleError }
    })

    return () => {
      metadataPlayers.forEach(({ audio, handleLoadedMetadata, handleError }) => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('error', handleError)
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      })
    }
  }, [songs])

  return (
    <ul className="mt-6 space-y-2">
      {songs.map((song) => {
        const isCurrentSong = currentSong?.id === song.id

        return (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => selectSong(song)}
              aria-current={isCurrentSong ? 'true' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isCurrentSong
                  ? 'bg-violet-500/10 ring-1 ring-inset ring-violet-400/30'
                  : ''
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                {isCurrentSong && isPlaying ? (
                  <Equalizer />
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    {String(song.id).padStart(2, '0')}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate font-medium ${
                    isCurrentSong ? 'text-violet-200' : 'text-white'
                  }`}
                >
                  {song.title}
                </span>
                <span className="mt-1 block truncate text-sm text-slate-400">
                  {song.artist}
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">
                {formatTime(durations[song.id])}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default Playlist
