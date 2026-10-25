import { useCallback, useEffect, useRef, useState } from "react"
import songs from "../data/songs.js"

const STORAGE_KEYS = {
  volume: "volume",
  isShuffle: "shuffle",
  repeatMode: "repeat",
}

function getStorageKey(preference, userId) {
  return `mini-music-player:${preference}:${userId ?? "anonymous"}`
}

function readPreference(key, fallback, parse = (value) => value) {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : parse(value)
  } catch (error) {
    console.error(`Tidak dapat membaca preferensi ${key} dari localStorage.`, error)
    return fallback
  }
}

function savePreference(key, value) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch (error) {
    console.error(`Tidak dapat menyimpan preferensi ${key} ke localStorage.`, error)
  }
}

function getInitialSong(songList) {
  return songList[0] ?? null
}

function shuffleSongs(songList, currentSong) {
  const remaining = songList.filter((song) => song.id !== currentSong?.id)

  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[remaining[index], remaining[randomIndex]] = [
      remaining[randomIndex],
      remaining[index],
    ]
  }

  return currentSong ? [currentSong, ...remaining] : remaining
}

function useAudioPlayer(songList = songs, userId) {
  const [settingsOwner, setSettingsOwner] = useState(userId)
  const audioRef = useRef(null)
  const shuffleQueueRef = useRef([])
  const uploadedUrlsRef = useRef(new Set())
  const audioAvailabilityRef = useRef(new Map())
  const loadedSongSourceRef = useRef('')
  const [songsState, setSongs] = useState(songList)
  const [queue, setQueue] = useState([])
  const [currentSong, setCurrentSong] = useState(() =>
    getInitialSong(songList),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() =>
    readPreference(getStorageKey(STORAGE_KEYS.volume, userId), 1, (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 1)) : 1
    }),
  )
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(() =>
    readPreference(
      getStorageKey(STORAGE_KEYS.isShuffle, userId),
      "false",
      (value) => value === "true",
    ),
  )
  const [repeatMode, setRepeatMode] = useState(() =>
    readPreference(getStorageKey(STORAGE_KEYS.repeatMode, userId), "off", (value) =>
      ["off", "one", "all"].includes(value) ? value : "off",
    ),
  )
  const [playbackRate, setPlaybackRateState] = useState(1)

  const prepareAudio = useCallback(async (song) => {
    const audio = audioRef.current
    if (!audio || !song) return null

    if (!song.src.startsWith('blob:')) {
      let isAvailable = audioAvailabilityRef.current.get(song.src)
      if (isAvailable === undefined) {
        try {
          const response = await fetch(song.src, { method: 'HEAD' })
          isAvailable =
            response.ok &&
            response.headers.get('content-type')?.toLowerCase().startsWith('audio/') === true
        } catch {
          isAvailable = false
        }
        audioAvailabilityRef.current.set(song.src, isAvailable)
      }
      if (!isAvailable) throw new Error('File audio belum tersedia')
    }

    if (loadedSongSourceRef.current !== song.src) {
      audio.src = song.src
      loadedSongSourceRef.current = song.src
      audio.load()
      audio.currentTime = 0
    }
    audio.volume = volume
    audio.muted = isMuted
    audio.playbackRate = playbackRate
    return audio
  }, [isMuted, playbackRate, volume])

  const play = useCallback(async () => {
    if (!audioRef.current || !currentSong) return
    const audio = await prepareAudio(currentSong)
    return audio?.play()
  }, [currentSong, prepareAudio])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const selectSong = useCallback(
    async (songOrId, shouldPlay = true, preserveShuffleQueue = false) => {
      const song =
        typeof songOrId === "object"
          ? songOrId
          : songsState.find((item) => item.id === songOrId)
      if (!song || !songsState.some((item) => item.id === song.id)) return

      const audio = audioRef.current
      audio?.pause()

      setCurrentSong(song)
      setCurrentTime(0)
      setDuration(0)

      if (isShuffle && !preserveShuffleQueue) {
        shuffleQueueRef.current = shuffleSongs(songsState, song)
      }

      if (shouldPlay && audio) {
        const preparedAudio = await prepareAudio(song)
        return preparedAudio?.play()
      }
    },
    [isShuffle, prepareAudio, songsState],
  )

  const addSong = useCallback((file) => {
    const hasAudioType = file?.type?.startsWith("audio/")
    const hasAudioExtension =
      !file?.type &&
      /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav|webm)$/i.test(file?.name ?? "")
    if (!(file instanceof File) || (!hasAudioType && !hasAudioExtension)) {
      throw new Error("Pilih file audio yang valid.")
    }

    const src = URL.createObjectURL(file)
    uploadedUrlsRef.current.add(src)
    const song = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: file.name.replace(/\.[^.]+$/, "") || file.name,
      artist: "Unggahan",
      album: "Unggahan",
      src,
      cover: songsState[0]?.cover ?? "",
      lyrics: [],
    }
    const updatedSongs = [...songsState, song]
    setSongs(updatedSongs)
    setCurrentSong(song)
    setCurrentTime(0)
    setDuration(0)
    if (isShuffle) {
      shuffleQueueRef.current = shuffleSongs(updatedSongs, song)
    }

    const audio = audioRef.current
    if (audio) {
      audio.src = song.src
      loadedSongSourceRef.current = song.src
      audio.load()
    }

    return song
  }, [isShuffle, songsState])

  const enqueue = useCallback((song) => {
    if (!song || !songsState.some((item) => item.id === song.id)) return
    setQueue((current) =>
      current.some((item) => item.id === song.id)
        ? current
        : [...current, song],
    )
  }, [songsState])

  const removeFromQueue = useCallback((songId) => {
    setQueue((current) => current.filter((song) => song.id !== songId))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  const next = useCallback(
    (automatic = false) => {
      if (!currentSong || songsState.length === 0) return

      if (queue.length > 0) {
        const [queuedSong, ...remainingQueue] = queue
        setQueue(remainingQueue)
        selectSong(queuedSong, true, true)
        return
      }

      if (isShuffle) {
        let queue = shuffleQueueRef.current
        let currentIndex = queue.findIndex((song) => song.id === currentSong.id)

        if (currentIndex === -1) {
          queue = shuffleSongs(songsState, currentSong)
          shuffleQueueRef.current = queue
          currentIndex = 0
        }

        const nextIndex = currentIndex + 1
        if (nextIndex >= queue.length) {
          if (automatic && repeatMode === "off") {
            setIsPlaying(false)
            return
          }
          queue = shuffleSongs(songsState, currentSong)
          shuffleQueueRef.current = queue
          selectSong(queue[1] ?? queue[0], true, true)
          return
        }

        selectSong(queue[nextIndex], true, true)
        return
      }

      const currentIndex = songsState.findIndex(
        (song) => song.id === currentSong.id,
      )
      const nextIndex = currentIndex + 1
      if (automatic && nextIndex >= songsState.length && repeatMode === "off") {
        setIsPlaying(false)
        return
      }

      selectSong(songsState[nextIndex % songsState.length])
    },
    [currentSong, isShuffle, queue, repeatMode, selectSong, songsState],
  )

  const prev = useCallback(() => {
    if (!currentSong || songsState.length === 0) return

    if (isShuffle && shuffleQueueRef.current.length > 0) {
      const currentIndex = shuffleQueueRef.current.findIndex(
        (song) => song.id === currentSong.id,
      )
      const previousIndex =
        (currentIndex - 1 + shuffleQueueRef.current.length) %
        shuffleQueueRef.current.length
      selectSong(shuffleQueueRef.current[previousIndex], true, true)
      return
    }

    const currentIndex = songsState.findIndex(
      (song) => song.id === currentSong.id,
    )
    const previousIndex =
      (currentIndex - 1 + songsState.length) % songsState.length
    selectSong(songsState[previousIndex])
  }, [currentSong, isShuffle, selectSong, songsState])

  const toggle = useCallback(() => {
    if (audioRef.current?.paused) return play()
    pause()
  }, [pause, play])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(time)) return

    const boundedTime = Math.max(0, Math.min(time, audio.duration || 0))
    audio.currentTime = boundedTime
    setCurrentTime(boundedTime)
  }, [])

  const setVolume = useCallback((nextVolume) => {
    const audio = audioRef.current
    if (!Number.isFinite(nextVolume)) return

    const boundedVolume = Math.max(0, Math.min(nextVolume, 1))
    setVolumeState(boundedVolume)
    if (audio) {
      audio.volume = boundedVolume
      if (boundedVolume > 0) {
        audio.muted = false
        setIsMuted(false)
      }
    }
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    const nextMuted = !(audio?.muted ?? isMuted)

    setIsMuted(nextMuted)
    if (audio) audio.muted = nextMuted
  }, [isMuted])

  const toggleShuffle = useCallback(() => {
    setIsShuffle((enabled) => {
      const nextEnabled = !enabled
      if (nextEnabled) {
        shuffleQueueRef.current = shuffleSongs(songsState, currentSong)
      }
      return nextEnabled
    })
  }, [currentSong, songsState])

  const cycleRepeat = useCallback(() => {
    setRepeatMode((mode) => {
      if (mode === "off") return "one"
      if (mode === "one") return "all"
      return "off"
    })
  }, [])

  const setPlaybackRate = useCallback((rate) => {
    const allowedRates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    if (!allowedRates.includes(rate)) return
    setPlaybackRateState(rate)
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [])

  useEffect(() => {
    if (settingsOwner === userId) return
    const audio = audioRef.current
    audio?.pause()
    uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    uploadedUrlsRef.current.clear()
    setSongs(songList)
    setQueue([])
    setCurrentSong(getInitialSong(songList))
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setIsMuted(false)
    setVolumeState(
      readPreference(getStorageKey(STORAGE_KEYS.volume, userId), 1, (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 1)) : 1
      }),
    )
    setIsShuffle(
      readPreference(
        getStorageKey(STORAGE_KEYS.isShuffle, userId),
        "false",
        (value) => value === "true",
      ),
    )
    setRepeatMode(
      readPreference(
        getStorageKey(STORAGE_KEYS.repeatMode, userId),
        "off",
        (value) => ["off", "one", "all"].includes(value) ? value : "off",
      ),
    )
    setPlaybackRateState(1)
    if (audio) {
      audio.removeAttribute("src")
      loadedSongSourceRef.current = ''
      audio.load()
      audio.volume = readPreference(
        getStorageKey(STORAGE_KEYS.volume, userId),
        1,
        (value) => {
          const parsed = Number(value)
          return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 1)) : 1
        },
      )
      audio.muted = false
      audio.playbackRate = 1
    }
    setSettingsOwner(userId)
  }, [settingsOwner, songList, userId])

  useEffect(() => {
    const nextSongs = songList
    const matchingSong = nextSongs.find((song) => song.id === currentSong?.id)
    const nextSong = matchingSong ??
      (String(currentSong?.id ?? '').startsWith('upload-')
        ? currentSong
        : nextSongs[0] ?? null)
    setSongs(nextSongs)
    setCurrentSong(nextSong)
    setQueue((current) => current.filter((song) =>
      nextSongs.some((catalogSong) => catalogSong.id === song.id),
    ))
  }, [songList])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolumeState(audio.volume)
      setIsMuted(audio.muted)
    }
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        setCurrentTime(0)
        audio.play().catch((error) => {
          console.error("Gagal mengulang lagu yang sedang diputar.", error)
          setIsPlaying(false)
        })
        return
      }
      const playback = next(true)
      playback?.catch((error) => {
        if (error?.message !== 'File audio belum tersedia') {
          console.error("Gagal memutar lagu berikutnya.", error)
        }
        setIsPlaying(false)
      })
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("volumechange", handleVolumeChange)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("volumechange", handleVolumeChange)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [next, repeatMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = isMuted
    audio.playbackRate = playbackRate
  }, [isMuted, playbackRate, volume])

  useEffect(() => {
    if (!userId || settingsOwner !== userId) return
    savePreference(getStorageKey(STORAGE_KEYS.volume, userId), volume)
  }, [settingsOwner, userId, volume])

  useEffect(() => {
    if (!userId || settingsOwner !== userId) return
    savePreference(getStorageKey(STORAGE_KEYS.isShuffle, userId), isShuffle)
  }, [isShuffle, settingsOwner, userId])

  useEffect(() => {
    if (!userId || settingsOwner !== userId) return
    savePreference(getStorageKey(STORAGE_KEYS.repeatMode, userId), repeatMode)
  }, [repeatMode, settingsOwner, userId])

  useEffect(
    () => () => {
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  return {
    audioRef,
    songs: songsState,
    queue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setPlaybackRate,
    selectSong,
    addSong,
    enqueue,
    removeFromQueue,
    clearQueue,
  }
}

export default useAudioPlayer
