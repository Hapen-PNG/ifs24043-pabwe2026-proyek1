import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addSearchHistory,
  clearSearchHistory,
  fetchSearchHistory,
  removeSearchHistory,
} from '../features/activity/states/action.js'
import { setSearchHistory } from '../features/activity/states/reducer.js'
import { clearLegacyData } from '../helpers/legacyData.js'

function useSearchHistory(userId) {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.activity.searchHistory)
  const status = useSelector((state) => state.activity.searchHistoryStatus)

  useEffect(() => {
    if (userId === undefined || userId === null) return
    dispatch(fetchSearchHistory())
      .unwrap()
      .then(() => clearLegacyData(['search-history']))
      .catch(() => {})
  }, [dispatch, userId])

  const addSearch = useCallback((value) => {
    const term = value.trim()
    if (!term || userId === undefined || userId === null) return Promise.resolve()
    const snapshot = items
    dispatch(setSearchHistory([
      { id: `pending-${Date.now()}`, term, created_at: new Date().toISOString() },
      ...snapshot.filter((entry) => entry.term.toLocaleLowerCase() !== term.toLocaleLowerCase()),
    ].slice(0, 8)))
    return dispatch(addSearchHistory(term))
      .unwrap()
      .catch((error) => {
        dispatch(setSearchHistory(snapshot))
        return error
      })
  }, [dispatch, items, userId])

  const removeSearch = useCallback((value) => {
    const entry = items.find((item) => item.term === value)
    if (!entry || userId === undefined || userId === null) return Promise.resolve()
    const snapshot = items
    dispatch(setSearchHistory(items.filter((item) => item.id !== entry.id)))
    return dispatch(removeSearchHistory(entry.id))
      .unwrap()
      .catch((error) => {
        dispatch(setSearchHistory(snapshot))
        return error
      })
  }, [dispatch, items, userId])

  const clearHistory = useCallback(() => {
    if (userId === undefined || userId === null) return Promise.resolve()
    const snapshot = items
    dispatch(setSearchHistory([]))
    return dispatch(clearSearchHistory())
      .unwrap()
      .then(() => clearLegacyData(['search-history']))
      .catch((error) => {
        dispatch(setSearchHistory(snapshot))
        return error
      })
  }, [dispatch, items, userId])

  return {
    history: items.map((item) => item.term),
    loading: status === 'loading',
    unavailable: status === 'failed',
    addSearch,
    removeSearch,
    clearHistory,
  }
}

export default useSearchHistory
