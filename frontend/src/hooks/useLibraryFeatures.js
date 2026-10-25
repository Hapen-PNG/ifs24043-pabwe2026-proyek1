import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePlayer } from '../context/PlayerContext.jsx'
import { fetchRecent } from '../features/activity/states/action.js'
import { clearLegacyData } from '../helpers/legacyData.js'

function useLibraryFeatures(user) {
  const dispatch = useDispatch()
  const { songs } = usePlayer()
  const recent = useSelector((state) => state.activity.recent)
  const recentStatus = useSelector((state) => state.activity.recentStatus)
  const userId = user?.id

  useEffect(() => {
    if (userId === undefined || userId === null) return
    dispatch(fetchRecent())
      .unwrap()
      .then(() => clearLegacyData(['recent']))
      .catch(() => {})
  }, [dispatch, userId])

  const recentSongs = useMemo(
    () => recent.map((song) => songs.find((item) => item.id === song.id) ?? song),
    [recent, songs],
  )

  return { recentSongs, recentLoading: recentStatus === 'loading', recentUnavailable: recentStatus === 'failed' }
}

export default useLibraryFeatures
