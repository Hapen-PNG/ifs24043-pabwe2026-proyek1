import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLibrary } from '../context/LibraryContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'
import useSearchHistory from '../hooks/useSearchHistory.js'
import CoverArt from '../components/CoverArt.jsx'

const filters = [
  { id: 'all', label: 'Semua' },
  { id: 'song', label: 'Lagu' },
  { id: 'artist', label: 'Artis' },
  { id: 'album', label: 'Album' },
]

const popularSearches = [
  { type: 'Artis', value: 'Nada Senja' },
  { type: 'Lagu', value: 'Pagi yang Baru' },
  { type: 'Album', value: 'Langit Kecil' },
  { type: 'Artis', value: 'Ruang Rindu' },
]

function normalize(value) {
  return value.trim().toLocaleLowerCase()
}

function HighlightText({ text, query }) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return text

  const start = text.toLocaleLowerCase().indexOf(normalizedQuery.toLocaleLowerCase())
  if (start < 0) return text

  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-violet-400/25 text-violet-200">
        {text.slice(start, start + normalizedQuery.length)}
      </mark>
      {text.slice(start + normalizedQuery.length)}
    </>
  )
}

function Search() {
  const user = useSelector((state) => state.users.user)
  const { songs, selectSong, enqueue } = usePlayer()
  const { favoriteIds, toggleFavorite } = useLibrary()
  const inputRef = useRef(null)
  const blurTimeoutRef = useRef(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('az')
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false)
  const {
    history,
    loading: historyLoading,
    unavailable: historyUnavailable,
    addSearch,
    removeSearch,
    clearHistory,
  } = useSearchHistory(user?.id)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timeoutId)
  }, [query])

  useEffect(
    () => () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current)
      }
    },
    [],
  )

  const suggestions = useMemo(() => {
    const term = normalize(query)
    if (!term) return []
    const candidates = [
      ...songs.map((song) => song.title),
      ...songs.map((song) => song.artist),
      ...songs.map((song) => song.album || 'Unggahan'),
    ]
    const seen = new Set()
    return candidates
      .filter((value) => value.toLocaleLowerCase().includes(term))
      .filter((value) => {
        const key = value.toLocaleLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
  }, [query, songs])

  const songMatches = useMemo(() => {
    const term = normalize(debouncedQuery)
    if (!term) return []
    return songs
      .filter((song) =>
        [song.title, song.artist, song.album || 'Unggahan'].some((field) =>
          normalize(field).includes(term),
        ),
      )
      .sort((a, b) =>
        sort === 'artist'
          ? a.artist.localeCompare(b.artist, 'id')
          : a.title.localeCompare(b.title, 'id'),
      )
  }, [debouncedQuery, songs, sort])

  const artistMatches = useMemo(() => {
    const term = normalize(debouncedQuery)
    if (!term) return []
    return [...new Set(songs.map((song) => song.artist))]
      .filter((artist) => normalize(artist).includes(term))
      .sort((a, b) => a.localeCompare(b, 'id'))
  }, [debouncedQuery, songs])

  const albumMatches = useMemo(() => {
    const term = normalize(debouncedQuery)
    if (!term) return []
    return [...new Set(songs.map((song) => song.album || 'Unggahan'))]
      .filter((album) => normalize(album).includes(term))
      .sort((a, b) => a.localeCompare(b, 'id'))
  }, [debouncedQuery, songs])

  const recordSearch = (value) => {
    const search = value.trim()
    if (!search) return
    setQuery(search)
    setDebouncedQuery(search)
    setIsAutocompleteOpen(false)
    setActiveSuggestion(-1)
    addSearch(search)
  }

  const selectSuggestion = (value) => {
    recordSearch(value)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault()
      setIsAutocompleteOpen(true)
      setActiveSuggestion((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault()
      setIsAutocompleteOpen(true)
      setActiveSuggestion((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected = suggestions[activeSuggestion]
      recordSearch(selected || query)
    } else if (event.key === 'Escape') {
      setIsAutocompleteOpen(false)
      setActiveSuggestion(-1)
    }
  }

  const chooseArtist = (artist) => {
    setFilter('song')
    recordSearch(artist)
  }

  const chooseAlbum = (album) => {
    setFilter('song')
    recordSearch(album)
  }

  const hasResults =
    (filter === 'all' || filter === 'song') && songMatches.length > 0 ||
    (filter === 'all' || filter === 'artist') && artistMatches.length > 0 ||
    (filter === 'all' || filter === 'album') && albumMatches.length > 0

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
      <h1 className="text-2xl font-bold">Pencarian</h1>
      <p className="mt-2 text-sm text-slate-400">
        Temukan lagu, artis, atau album di koleksi Anda.
      </p>

      <div className="relative mt-6">
        <label htmlFor="song-search" className="sr-only">Cari lagu atau artis</label>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 transition-colors focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/30">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5 shrink-0 text-slate-400"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            ref={inputRef}
            id="song-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isAutocompleteOpen && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={
              activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveSuggestion(-1)
              setIsAutocompleteOpen(true)
            }}
            onFocus={() => {
              if (blurTimeoutRef.current !== null) {
                window.clearTimeout(blurTimeoutRef.current)
                blurTimeoutRef.current = null
              }
              if (query) setIsAutocompleteOpen(true)
            }}
            onBlur={() => {
              blurTimeoutRef.current = window.setTimeout(
                () => setIsAutocompleteOpen(false),
                100,
              )
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari lagu atau artis"
            className="min-w-0 flex-1 bg-transparent py-4 text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setDebouncedQuery('')
                setActiveSuggestion(-1)
                setIsAutocompleteOpen(false)
                inputRef.current?.focus()
              }}
              aria-label="Hapus teks pencarian"
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {isAutocompleteOpen && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            aria-label="Saran pencarian"
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion} role="presentation">
                <button
                  id={`search-suggestion-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    activeSuggestion === index
                      ? 'bg-violet-500/20 text-violet-100'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <HighlightText text={suggestion} query={query} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(history.length > 0 || historyLoading || historyUnavailable) && (
        <section aria-labelledby="search-history-heading" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="search-history-heading" className="text-sm font-semibold text-slate-300">
              Riwayat pencarian
            </h2>
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs font-medium text-slate-400 hover:text-rose-300 focus-visible:outline-none focus-visible:underline"
            >
              Hapus semua
            </button>
          </div>
          {historyLoading && (
            <div role="status" aria-label="Memuat riwayat pencarian" className="mt-3 flex gap-2">
              <span className="h-8 w-24 animate-pulse rounded-full bg-slate-800" />
              <span className="h-8 w-16 animate-pulse rounded-full bg-slate-800" />
            </div>
          )}
          {historyUnavailable && (
            <p className="mt-3 text-sm text-slate-400">Data belum dapat dimuat</p>
          )}
          {!historyLoading && !historyUnavailable && <ul className="mt-3 flex flex-wrap gap-2">
            {history.map((item) => (
              <li key={item} className="flex items-center rounded-full border border-slate-700 bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className="rounded-l-full px-3 py-2 text-sm text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {item}
                </button>
                <button
                  type="button"
                  onClick={() => removeSearch(item)}
                  aria-label={`Hapus pencarian ${item} dari riwayat`}
                  className="rounded-r-full px-2 py-2 text-slate-500 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>}
        </section>
      )}

      <section className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Filter hasil pencarian">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                filter === item.id
                  ? 'bg-violet-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Urutkan
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="az">A–Z</option>
            <option value="artist">Artis</option>
          </select>
        </label>
      </section>

      {!debouncedQuery ? (
        <section aria-labelledby="popular-searches-heading" className="mt-8">
          <h2 id="popular-searches-heading" className="text-lg font-semibold">Populer</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {popularSearches.map((item) => (
              <li key={`${item.type}-${item.value}`}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(item.value)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left transition-colors hover:border-violet-400/40 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <span className="font-medium text-slate-200">{item.value}</span>
                  <span className="text-xs text-slate-500">{item.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="mt-8 space-y-8" aria-live="polite">
          {!hasResults ? (
            <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-12 text-center">
              <span aria-hidden="true" className="text-3xl">♫</span>
              <h2 className="mt-3 font-semibold text-white">Belum ada hasil</h2>
              <p className="mt-1 text-sm text-slate-400">
                Coba kata kunci lain atau periksa ejaan pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              {(filter === 'all' || filter === 'song') && songMatches.length > 0 && (
                <section aria-labelledby="song-results-heading">
                  <h2 id="song-results-heading" className="text-lg font-semibold">Lagu</h2>
                  <ul className="mt-3 space-y-2">
                    {songMatches.map((song) => (
                      <li key={song.id} className="flex items-center gap-3 rounded-xl bg-slate-950/50 p-3">
                        <CoverArt song={song} className="h-12 w-12 shrink-0 rounded-lg" />
                        <button
                          type="button"
                          onClick={() => selectSong(song)}
                          className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                          <span className="block truncate font-medium text-white">
                            <HighlightText text={song.title} query={debouncedQuery} />
                          </span>
                          <span className="mt-1 block truncate text-sm text-slate-400">
                            <HighlightText text={song.artist} query={debouncedQuery} />
                            <span aria-hidden="true"> · </span>
                            <HighlightText text={song.album || 'Unggahan'} query={debouncedQuery} />
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => enqueue(song)}
                          aria-label={`Tambahkan ${song.title} ke antrean`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                          <span aria-hidden="true">＋</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(song.id)}
                          aria-label={`${favoriteIds.includes(song.id) ? 'Hapus dari' : 'Tambahkan ke'} lagu favorit: ${song.title}`}
                          aria-pressed={favoriteIds.includes(song.id)}
                          className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                            favoriteIds.includes(song.id)
                              ? 'text-rose-400'
                              : 'text-slate-400 hover:text-rose-300'
                          }`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill={favoriteIds.includes(song.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(filter === 'all' || filter === 'artist') && artistMatches.length > 0 && (
                <section aria-labelledby="artist-results-heading">
                  <h2 id="artist-results-heading" className="text-lg font-semibold">Artis</h2>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {artistMatches.map((artist) => (
                      <li key={artist}>
                        <button
                          type="button"
                          onClick={() => chooseArtist(artist)}
                          className="w-full rounded-xl bg-slate-950/50 p-4 text-left font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                          <HighlightText text={artist} query={debouncedQuery} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(filter === 'all' || filter === 'album') && albumMatches.length > 0 && (
                <section aria-labelledby="album-results-heading">
                  <h2 id="album-results-heading" className="text-lg font-semibold">Album</h2>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {albumMatches.map((album) => (
                      <li key={album}>
                        <button
                          type="button"
                          onClick={() => chooseAlbum(album)}
                          className="w-full rounded-xl bg-slate-950/50 p-4 text-left font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                          <HighlightText text={album} query={debouncedQuery} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default Search
