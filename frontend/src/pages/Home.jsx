import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import LirikMini from '../components/LirikMini.jsx'
import PlaybackOptions from '../components/PlaybackOptions.jsx'
import Player from '../components/Player.jsx'
import Playlist from '../components/Playlist.jsx'
import QueuePanel from '../components/QueuePanel.jsx'
import RecentlyPlayed from '../components/RecentlyPlayed.jsx'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import useLibraryFeatures from '../hooks/useLibraryFeatures.js'
import useSleepTimer from '../hooks/useSleepTimer.js'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function Home() {
  const user = useSelector((state) => state.users.user)
  const { addSong, pause, enqueue, queue } = usePlayer()
  const fileInputRef = useRef(null)
  const [uploadError, setUploadError] = useState('')
  const [activeTab, setActiveTab] = useState('queue')
  const { favoriteIds, toggleFavorite } = useLibrary()
  const { recentSongs, recentLoading, recentUnavailable } = useLibraryFeatures(user)
  const { remainingSeconds, start, cancel } = useSleepTimer(pause)

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
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
            {getGreeting()}, {user?.name || 'Pendengar'}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Musik untuk harimu</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label htmlFor="audio-upload" className="sr-only">
            Pilih file audio untuk diunggah
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Unggah lagu
          </button>
        </div>
      </header>

      {uploadError && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">
          {uploadError}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.8fr)_minmax(18rem,1fr)]">
        <section
          aria-labelledby="player-heading"
          className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
        >
          <h2 id="player-heading" className="mb-5 text-lg font-semibold">Pemutar</h2>
          <Player />
          <PlaybackOptions
            remainingSeconds={remainingSeconds}
            startTimer={start}
            cancelTimer={cancel}
          />
        </section>

        <LirikMini />

        <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-800" role="tablist" aria-label="Konten lagu">
            {[
              { id: 'queue', label: `Antrean${queue.length ? ` (${queue.length})` : ''}` },
              { id: 'playlist', label: 'Playlist' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`home-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`home-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  activeTab === tab.id
                    ? 'border-violet-400 text-violet-200'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`home-panel-${activeTab}`}
            aria-labelledby={`home-tab-${activeTab}`}
            className="max-h-[32rem] overflow-y-auto"
          >
            {activeTab === 'queue' ? (
              <QueuePanel />
            ) : (
              <Playlist
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                onAddToQueue={enqueue}
              />
            )}
          </div>
        </section>
      </div>

      <RecentlyPlayed
        songs={recentSongs}
        loading={recentLoading}
        unavailable={recentUnavailable}
      />
    </>
  )
}

export default Home
