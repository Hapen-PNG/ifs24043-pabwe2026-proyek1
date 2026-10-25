import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStats, recordPlay } from '../features/activity/states/action.js'
import { clearLegacyData } from '../helpers/legacyData.js'

function usePlaybackStats(audioRef, currentSong, user) {
  const dispatch = useDispatch()
  const userId = user?.id
  const stats = useSelector((state) => state.activity.stats)
  const statsStatus = useSelector((state) => state.activity.statsStatus)

  useEffect(() => {
    if (userId === undefined || userId === null) return
    dispatch(fetchStats())
      .unwrap()
      .then(() => clearLegacyData(['play-counts']))
      .catch(() => {})
  }, [dispatch, userId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || userId === undefined || userId === null) return undefined

    const handlePlay = () => {
      if (!currentSong || !Number.isSafeInteger(Number(currentSong.id))) return
      dispatch(recordPlay(currentSong))
        .unwrap()
        .catch(() => {})
    }

    audio.addEventListener('play', handlePlay)
    return () => audio.removeEventListener('play', handlePlay)
  }, [audioRef, currentSong, dispatch, userId])

  return {
    totalPlayCount: stats.totalPlays,
    topPlayedSongs: stats.topPlayed,
    statsLoading: statsStatus === 'loading',
    statsUnavailable: statsStatus === 'failed',
    playCounts: Object.fromEntries(stats.topPlayed.map(({ id, count }) => [id, count])),
    currentSongId: currentSong?.id,
  }
}

export default usePlaybackStats
