import { useState } from 'react'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import CoverArt from '../components/CoverArt.jsx'

function LibrarySong({ song, onRemove, removeLabel }) {
  const { selectSong } = usePlayer()

  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-950/50 p-3">
      <CoverArt song={song} className="h-12 w-12 shrink-0 rounded-lg" />
      <button
        type="button"
        onClick={() => selectSong(song)}
        className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <span className="block truncate font-medium text-white">{song.title}</span>
        <span className="mt-1 block truncate text-sm text-slate-400">
          {song.artist}{song.album ? ` · ${song.album}` : ''}
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Hapus
        </button>
      )}
    </li>
  )
}

function Library() {
  const {
    favoriteSongs,
    toggleFavorite,
    loading,
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    dataUnavailable,
  } = useLibrary()
  const { songs, clearQueue, enqueue, selectSong } = usePlayer()
  const [activeTab, setActiveTab] = useState('favorites')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [songToAdd, setSongToAdd] = useState('')
  const [error, setError] = useState('')
  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId,
  )

  const playAll = (playlistSongs) => {
    if (playlistSongs.length === 0) return
    clearQueue()
    playlistSongs.slice(1).forEach((song) => enqueue(song))
    selectSong(playlistSongs[0])
  }

  const handleCreatePlaylist = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const playlist = await createPlaylist(newPlaylistName)
      setNewPlaylistName('')
      if (playlist) setSelectedPlaylistId(playlist.id)
    } catch (cause) {
      setError(cause.message)
    }
  }

  const handleRenamePlaylist = (event) => {
    event.preventDefault()
    setError('')
    try {
      renamePlaylist(selectedPlaylist.id, renameValue)
      setRenameValue('')
    } catch (cause) {
      setError(cause.message)
    }
  }

  const handleDeletePlaylist = (playlist) => {
    const confirmed = window.confirm(
      `Hapus playlist "${playlist.name}"? Lagu di playlist tidak akan dihapus dari koleksi.`,
    )
    if (!confirmed) return
    deletePlaylist(playlist.id)
    if (selectedPlaylistId === playlist.id) setSelectedPlaylistId(null)
  }

  const handleAddSong = (event) => {
    event.preventDefault()
    if (!selectedPlaylist || songToAdd === '') return
    const song = songs.find((item) => String(item.id) === songToAdd)
    if (!song) return
    addSongToPlaylist(selectedPlaylist.id, song.id)
    setSongToAdd('')
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
        Koleksi
      </p>
      <h1 className="mt-2 text-2xl font-bold">Perpustakaan musik</h1>
      {loading && (
        <div role="status" aria-label="Memuat koleksi akun" className="mt-3 flex gap-2">
          <span className="h-2 w-24 animate-pulse rounded-full bg-slate-700" />
          <span className="h-2 w-16 animate-pulse rounded-full bg-slate-700" />
        </div>
      )}
      {dataUnavailable && (
        <p className="mt-3 text-sm text-slate-400">Data belum dapat dimuat</p>
      )}

      <div className="mt-6 flex gap-2 border-b border-slate-800" role="tablist" aria-label="Jenis koleksi">
        {[
          { id: 'favorites', label: 'Lagu Favorit' },
          { id: 'playlists', label: 'Playlist Saya' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`library-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`library-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              activeTab === tab.id
                ? 'border-violet-400 text-violet-200'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}

      <div
        role="tabpanel"
        id={`library-panel-${activeTab}`}
        aria-labelledby={`library-tab-${activeTab}`}
        className="pt-6"
      >
        {activeTab === 'favorites' ? (
          <section aria-labelledby="favorites-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="favorites-heading" className="text-lg font-semibold">Lagu Favorit</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {loading ? 'Memuat…' : `${favoriteSongs.length} lagu disukai`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => playAll(favoriteSongs)}
                disabled={favoriteSongs.length === 0}
                className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Putar semua
              </button>
            </div>
            {loading ? (
              <div aria-hidden="true" className="mt-5 space-y-2">
                <span className="block h-16 animate-pulse rounded-xl bg-slate-800" />
                <span className="block h-16 animate-pulse rounded-xl bg-slate-800" />
              </div>
            ) : favoriteSongs.length ? (
              <ul className="mt-5 space-y-2">
                {favoriteSongs.map((song) => (
                  <LibrarySong
                    key={song.id}
                    song={song}
                    onRemove={() => toggleFavorite(song.id)}
                    removeLabel={`Hapus ${song.title} dari lagu favorit`}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                Belum ada lagu favorit. Sukai lagu dari Beranda atau Pencarian.
              </p>
            )}
          </section>
        ) : (
          <section aria-labelledby="playlists-heading">
            <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.75fr)_minmax(0,1.25fr)]">
              <div>
                <h2 id="playlists-heading" className="text-lg font-semibold">Playlist Saya</h2>
                <form onSubmit={handleCreatePlaylist} className="mt-4 flex gap-2">
                  <label htmlFor="new-playlist-name" className="sr-only">Nama playlist baru</label>
                  <input
                    id="new-playlist-name"
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    placeholder="Nama playlist"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Buat
                  </button>
                </form>

                {loading ? (
                  <div aria-hidden="true" className="mt-4 space-y-2">
                    <span className="block h-12 animate-pulse rounded-xl bg-slate-800" />
                    <span className="block h-12 animate-pulse rounded-xl bg-slate-800" />
                  </div>
                ) : playlists.length ? (
                  <ul className="mt-4 space-y-2">
                    {playlists.map((playlist) => (
                      <li key={playlist.id}>
                        <div className={`flex items-center gap-2 rounded-xl p-2 ${
                          selectedPlaylistId === playlist.id ? 'bg-violet-500/10 ring-1 ring-violet-400/30' : 'bg-slate-950/50'
                        }`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlaylistId(playlist.id)
                              setRenameValue(playlist.name)
                              setError('')
                            }}
                            aria-pressed={selectedPlaylistId === playlist.id}
                            className="min-w-0 flex-1 rounded-lg p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <span className="block truncate font-medium text-white">{playlist.name}</span>
                            <span className="mt-1 block text-xs text-slate-400">{playlist.songs.length} lagu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlaylist(playlist)}
                            aria-label={`Hapus playlist ${playlist.name}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-slate-400">Belum ada playlist. Buat playlist pertama Anda.</p>
                )}
              </div>

              <div className="min-w-0">
                {selectedPlaylist ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedPlaylist.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{selectedPlaylist.songs.length} lagu</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => playAll(selectedPlaylist.songs)}
                        disabled={selectedPlaylist.songs.length === 0}
                        className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Putar playlist
                      </button>
                    </div>
                    <form onSubmit={handleRenamePlaylist} className="mt-4 flex gap-2">
                      <label htmlFor="rename-playlist-name" className="sr-only">Nama playlist baru</label>
                      <input
                        id="rename-playlist-name"
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                      >
                        Ganti nama
                      </button>
                    </form>
                    <form onSubmit={handleAddSong} className="mt-4 flex gap-2">
                      <label htmlFor="add-playlist-song" className="sr-only">Pilih lagu untuk ditambahkan</label>
                      <select
                        id="add-playlist-song"
                        value={songToAdd}
                        onChange={(event) => setSongToAdd(event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        <option value="">Pilih lagu...</option>
                        {songs
                          .filter((song) => !selectedPlaylist.songIds.includes(song.id))
                          .map((song) => (
                            <option key={song.id} value={String(song.id)}>{song.title} — {song.artist}</option>
                          ))}
                      </select>
                      <button
                        type="submit"
                        disabled={songToAdd === ''}
                        className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50"
                      >
                        Tambah lagu
                      </button>
                    </form>
                    {selectedPlaylist.songs.length ? (
                      <ul className="mt-4 space-y-2">
                        {selectedPlaylist.songs.map((song) => (
                          <LibrarySong
                            key={song.id}
                            song={song}
                            onRemove={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                            removeLabel={`Hapus ${song.title} dari playlist ${selectedPlaylist.name}`}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                        Playlist ini masih kosong. Tambahkan lagu untuk mulai mendengarkan.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                    Pilih playlist untuk melihat dan mengelola lagunya.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

export default Library
