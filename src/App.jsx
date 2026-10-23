import { useEffect, useRef, useState } from 'react'
import Player from './components/Player.jsx'
import Playlist from './components/Playlist.jsx'
import Lyrics from './components/Lyrics.jsx'
import { usePlayer } from './context/PlayerContext.jsx'

function App() {
  const { addSong, toggle, seek, currentTime, volume, setVolume } = usePlayer()
  const fileInputRef = useRef(null)
  const currentTimeRef = useRef(currentTime)
  const volumeRef = useRef(volume)
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('mini-music-player:theme') === 'light'
        ? 'light'
        : 'dark'
    } catch (error) {
      console.error('Tidak dapat membaca tema dari localStorage.', error)
      return 'dark'
    }
  })
  const [uploadError, setUploadError] = useState('')

  currentTimeRef.current = currentTime
  volumeRef.current = volume

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input, button, textarea, select, [contenteditable]'))
      ) {
        return
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return

      if (event.code === 'Space') {
        event.preventDefault()
        toggle()?.catch((error) => {
          console.error('Gagal memutar audio dari shortcut keyboard.', error)
        })
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seek(currentTimeRef.current - 5)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        seek(currentTimeRef.current + 5)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setVolume(volumeRef.current + 0.05)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setVolume(volumeRef.current - 0.05)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [seek, setVolume, toggle])

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      try {
        window.localStorage.setItem('mini-music-player:theme', nextTheme)
      } catch (error) {
        console.error('Tidak dapat menyimpan tema ke localStorage.', error)
      }
      return nextTheme
    })
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError('')
    try {
      await addSong(file)
    } catch (error) {
      console.error('Gagal menambahkan file audio.', error)
      setUploadError(error instanceof Error ? error.message : 'Gagal memuat audio.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${theme === 'light' ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'}`}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
              Pemutar Musik
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Musik untuk harimu</h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Aktifkan mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
            aria-pressed={theme === 'light'}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
          <section
            aria-labelledby="player-heading"
            className="min-h-80 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
          >
            <h2 id="player-heading" className="text-xl font-semibold">
              Pemutar
            </h2>
            <div className="mt-8">
              <Player />
            </div>
          </section>

          <aside
            aria-labelledby="playlist-heading"
            className="min-h-80 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="playlist-heading" className="text-xl font-semibold">
                Playlist
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Pilih file audio"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Unggah lagu
              </button>
            </div>
            {uploadError && (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                {uploadError}
              </p>
            )}
            <Playlist />
          </aside>
        </div>

        <section
          aria-labelledby="lyrics-heading"
          className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          <h2 id="lyrics-heading" className="mb-6 text-xl font-semibold">
            Lirik
          </h2>
          <Lyrics />
        </section>
      </div>
    </main>
  )
}

export default App
