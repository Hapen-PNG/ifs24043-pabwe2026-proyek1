import { createContext, useCallback, useContext, useState } from 'react'
import useAnalyser from '../hooks/useAnalyser.js'
import useAudioPlayer from '../hooks/useAudioPlayer.js'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const player = useAudioPlayer()
  const [playbackError, setPlaybackError] = useState('')
  const { analyserRef, resumeAudioContext, analyserError } = useAnalyser(
    player.audioRef,
  )

  const runPlayback = useCallback(async (action) => {
    try {
      setPlaybackError('')
      return await action()
    } catch (error) {
      console.error('Aksi pemutaran audio gagal.', error)
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
