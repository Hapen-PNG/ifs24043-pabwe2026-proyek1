import { useEffect, useMemo, useRef, useState } from 'react'

function readCounts(key) {
  try {
    const stored = window.localStorage.getItem(key)
    const counts = stored ? JSON.parse(stored) : {}
    return counts && typeof counts === 'object' && !Array.isArray(counts)
      ? counts
      : {}
  } catch (error) {
    console.error('Gagal membaca statistik pemutaran.', error)
    return {}
  }
}

function usePlaybackStats(audioRef, currentSong, user) {
  const userId = user?.id
  const key = userId ? `mini-music-player:play-counts:${userId}` : null
  const [countsState, setCountsState] = useState(() => ({
    key,
    counts: key ? readCounts(key) : {},
  }))
  const currentSongRef = useRef(currentSong)
  currentSongRef.current = currentSong
  const playId = currentSong?.id
  const counts = countsState.key === key ? countsState.counts : {}

  useEffect(() => {
    if (!key) {
      setCountsState({ key: null, counts: {} })
      return
    }
    setCountsState({ key, counts: readCounts(key) })
  }, [key])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !key) return undefined

    const handlePlay = () => {
      const song = currentSongRef.current
      if (!song) return
      setCountsState((current) => {
        const previous = current.key === key ? current.counts : readCounts(key)
        const next = {
          ...previous,
          [song.id]: (Number(previous[song.id]) || 0) + 1,
        }
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch (error) {
          console.error('Gagal menyimpan statistik pemutaran.', error)
        }
        return { key, counts: next }
      })
    }

    audio.addEventListener('play', handlePlay)
    return () => audio.removeEventListener('play', handlePlay)
  }, [audioRef, key])

  const totalPlayCount = useMemo(
    () => Object.values(counts).reduce((total, count) => total + (Number(count) || 0), 0),
    [counts],
  )
  const topPlayedSongs = useMemo(
    () =>
      Object.entries(counts)
        .map(([id, count]) => ({
          id,
          count: Number(count) || 0,
        }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [counts],
  )

  return { totalPlayCount, topPlayedSongs, playCounts: counts, currentSongId: playId }
}

export default usePlaybackStats
