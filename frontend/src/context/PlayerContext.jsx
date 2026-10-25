import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useAnalyser from '../hooks/useAnalyser.js'
import useAudioPlayer from '../hooks/useAudioPlayer.js'
import usePlaybackStats from '../hooks/usePlaybackStats.js'
import { fetchSongs } from '../features/songs/states/action.js'
import { recordRecent } from '../features/activity/states/action.js'
import { addRecentOptimistically } from '../features/activity/states/reducer.js'
import { clearLegacyData } from '../helpers/legacyData.js'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.users.user)
  const catalog = useSelector((state) => state.songs.items)
  const songsStatus = useSelector((state) => state.songs.status)
  const player = useAudioPlayer(catalog, user?.id ?? user?.email)
  const playbackStats = usePlaybackStats(player.audioRef, player.currentSong, user)
  const [playbackError, setPlaybackError] = useState('')
  const { analyserRef, resumeAudioContext, analyserError } = useAnalyser(
    player.audioRef,
  )

  useEffect(() => {
    clearLegacyData(['last-song'])
  }, [])

  useEffect(() => {
    if (songsStatus === 'idle') dispatch(fetchSongs())
  }, [dispatch, songsStatus])

  useEffect(() => {
    if (
      user?.id === undefined ||
      user?.id === null ||
      !player.isPlaying ||
      !player.currentSong ||
      !Number.isSafeInteger(Number(player.currentSong.id))
    ) return
    dispatch(addRecentOptimistically(player.currentSong))
    dispatch(recordRecent(Number(player.currentSong.id)))
      .unwrap()
      .catch(() => {})
  }, [dispatch, player.currentSong?.id, player.isPlaying, user?.id])

  const runPlayback = useCallback(async (action) => {
    try {
      setPlaybackError('')
      return await action()
    } catch (error) {
      if (error?.message !== 'File audio belum tersedia') {
        console.error('Aksi pemutaran audio gagal.', error)
      }
      setPlaybackError(
        error instanceof Error ? error.message : 'Pemutaran audio gagal.',
      )
      return undefined
    }
  }, [])

  const play = useCallback(async () => {
    return runPlayback(async () => {
      await resumeAudioContext()
      return player.play()
    })
  }, [player.play, resumeAudioContext, runPlayback])

  const toggle = useCallback(async () => {
    return runPlayback(async () => {
      if (player.isPlaying) {
        player.pause()
        return
      }
      await resumeAudioContext()
      return player.play()
    })
  }, [player.isPlaying, player.pause, player.play, resumeAudioContext, runPlayback])

  const next = useCallback(async () => {
    return runPlayback(async () => {
      await resumeAudioContext()
      return player.next()
    })
  }, [player.next, resumeAudioContext, runPlayback])

  const prev = useCallback(async () => {
    return runPlayback(async () => {
      await resumeAudioContext()
      return player.prev()
    })
  }, [player.prev, resumeAudioContext, runPlayback])

  const selectSong = useCallback(
    (song, shouldPlay = true) =>
      runPlayback(async () => {
        if (shouldPlay) await resumeAudioContext()
        return player.selectSong(song, shouldPlay)
      }),
    [player.selectSong, resumeAudioContext, runPlayback],
  )
  const addSong = useCallback(
    async (file) => {
      await resumeAudioContext()
      player.addSong(file)
      return runPlayback(() => player.audioRef.current?.play())
    },
    [player.addSong, player.audioRef, resumeAudioContext, runPlayback],
  )
  const contextValue = {
    ...player,
    ...playbackStats,
    songsLoading: songsStatus === 'loading',
    songsError: songsStatus === 'failed'
      ? 'Server lagu tidak tersedia; lagu bawaan sedang digunakan.'
      : '',
    analyserRef,
    analyserError,
    playbackError,
    resumeAudioContext,
    play,
    toggle,
    next,
    prev,
    selectSong,
    addSong,
  }

  return (
    <PlayerContext.Provider value={contextValue}>
      <audio
        ref={player.audioRef}
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      {songsStatus === 'loading' && (
        <p
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-3 z-[100] flex w-48 -translate-x-1/2 items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 shadow-lg"
        >
          <span aria-hidden="true" className="h-3 w-3 animate-pulse rounded-full bg-violet-300" />
          Memuat lagu…
        </p>
      )}
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const player = useContext(PlayerContext)

  if (!player) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }

  return player
}
