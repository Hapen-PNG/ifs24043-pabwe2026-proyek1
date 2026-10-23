import { useEffect, useMemo, useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

function readRecent(key) {
  try {
    const saved = window.localStorage.getItem(key)
    const ids = saved ? JSON.parse(saved) : []
    return Array.isArray(ids) ? ids.slice(0, 5) : []
  } catch (error) {
    console.error('Gagal membaca riwayat lagu.', error)
    return []
  }
}

function useLibraryFeatures(user) {
  const { currentSong, isPlaying, songs } = usePlayer()
  const recentKey = `mini-music-player:recent:${user?.id ?? user?.email ?? 'anonymous'}`
  const [recentState, setRecentState] = useState(() => ({
    key: recentKey,
    ids: readRecent(recentKey),
  }))
  const recentIds = recentState.key === recentKey ? recentState.ids : []

  useEffect(() => {
    setRecentState({ key: recentKey, ids: readRecent(recentKey) })
  }, [recentKey])

  useEffect(() => {
    if (recentState.key !== recentKey) return
    try {
      window.localStorage.setItem(recentKey, JSON.stringify(recentState.ids))
    } catch (error) {
      console.error('Gagal menyimpan riwayat lagu.', error)
    }
  }, [recentKey, recentState])

  useEffect(() => {
    if (!currentSong || !isPlaying) return
    setRecentState((current) => {
      const ids = current.key === recentKey ? current.ids : readRecent(recentKey)
      return {
        key: recentKey,
        ids: [currentSong.id, ...ids.filter((id) => id !== currentSong.id)].slice(0, 5),
      }
    })
  }, [currentSong?.id, isPlaying, recentKey])

  const recentSongs = useMemo(
    () => recentIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean),
    [recentIds, songs],
  )

  return { recentSongs }
}

export default useLibraryFeatures
