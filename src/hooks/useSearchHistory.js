import { useCallback, useEffect, useState } from 'react'

function readHistory(key) {
  try {
    const stored = window.localStorage.getItem(key)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === 'string').slice(0, 8)
      : []
  } catch (error) {
    console.error('Gagal membaca riwayat pencarian.', error)
    return []
  }
}

function useSearchHistory(userId) {
  const storageKey = `mini-music-player:search-history:${userId ?? 'anonymous'}`
  const [historyState, setHistoryState] = useState(() => ({
    key: storageKey,
    items: readHistory(storageKey),
  }))
  const history = historyState.key === storageKey ? historyState.items : []

  useEffect(() => {
    setHistoryState({ key: storageKey, items: readHistory(storageKey) })
  }, [storageKey])

  useEffect(() => {
    if (historyState.key !== storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(historyState.items))
    } catch (error) {
      console.error('Gagal menyimpan riwayat pencarian.', error)
    }
  }, [historyState, storageKey])

  const addSearch = useCallback((value) => {
    const search = value.trim()
    if (!search) return
    setHistoryState((current) => {
      const existing = current.key === storageKey ? current.items : readHistory(storageKey)
      const items = [search, ...existing.filter((item) => item.toLowerCase() !== search.toLowerCase())].slice(0, 8)
      return { key: storageKey, items }
    })
  }, [storageKey])

  const removeSearch = useCallback((value) => {
    setHistoryState((current) => ({
      key: storageKey,
      items: (current.key === storageKey ? current.items : readHistory(storageKey))
        .filter((item) => item !== value),
    }))
  }, [storageKey])

  const clearHistory = useCallback(() => {
    setHistoryState({ key: storageKey, items: [] })
  }, [storageKey])

  return { history, addSearch, removeSearch, clearHistory }
}

export default useSearchHistory
