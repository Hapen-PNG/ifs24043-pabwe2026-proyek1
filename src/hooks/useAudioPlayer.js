import { useCallback, useEffect, useRef, useState } from "react"
import songs from "../data/songs.js"

const STORAGE_KEYS = {
  currentSongId: "mini-music-player:last-song",
  volume: "mini-music-player:volume",
  isShuffle: "mini-music-player:shuffle",
  repeatMode: "mini-music-player:repeat",
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
  const savedId = readPreference(STORAGE_KEYS.currentSongId, null)
  return songList.find((song) => String(song.id) === savedId) ?? songList[0] ?? null
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

function useAudioPlayer(songList = songs) {
  const audioRef = useRef(null)
  const shuffleQueueRef = useRef([])
  const uploadedUrlsRef = useRef(new Set())
  const [songsState, setSongs] = useState(songList)
  const [currentSong, setCurrentSong] = useState(() => getInitialSong(songList))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() =>
    readPreference(STORAGE_KEYS.volume, 1, (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 1)) : 1
    }),
  )
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(() =>
    readPreference(STORAGE_KEYS.isShuffle, "false", (value) => value === "true"),
  )
  const [repeatMode, setRepeatMode] = useState(() =>
    readPreference(STORAGE_KEYS.repeatMode, "off", (value) =>
      ["off", "one", "all"].includes(value) ? value : "off",
    ),
  )

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    return audio.play()
  }, [currentSong])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const selectSong = useCallback(
    (songOrId, shouldPlay = true, preserveShuffleQueue = false) => {
      const song =
        typeof songOrId === "object"
          ? songOrId
          : songsState.find((item) => item.id === songOrId)
      if (!song || !songsState.some((item) => item.id === song.id)) return

      const audio = audioRef.current
      if (audio) {
        audio.src = song.src
        audio.load()
        audio.currentTime = 0
      }

      setCurrentSong(song)
      setCurrentTime(0)
      setDuration(0)

      if (isShuffle && !preserveShuffleQueue) {
        shuffleQueueRef.current = shuffleSongs(songsState, song)
      }

      if (shouldPlay && audio) return audio.play()
    },
    [isShuffle, songsState],
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
      audio.load()
    }

    return song
  }, [isShuffle, songsState])

  const next = useCallback(
    (automatic = false) => {
      if (!currentSong || songsState.length === 0) return

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
    [currentSong, isShuffle, repeatMode, selectSong, songsState],
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
        console.error("Gagal memutar lagu berikutnya.", error)
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
    if (!audio || !currentSong) return

    audio.src = currentSong.src
    audio.volume = volume
    audio.muted = isMuted
    audio.load()
  }, [])

  useEffect(() => {
    savePreference(STORAGE_KEYS.currentSongId, currentSong?.id ?? "")
  }, [currentSong])

  useEffect(() => {
    savePreference(STORAGE_KEYS.volume, volume)
  }, [volume])

  useEffect(() => {
    savePreference(STORAGE_KEYS.isShuffle, isShuffle)
  }, [isShuffle])

  useEffect(() => {
    savePreference(STORAGE_KEYS.repeatMode, repeatMode)
  }, [repeatMode])

  useEffect(
    () => () => {
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  return {
    audioRef,
    songs: songsState,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
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
    selectSong,
    addSong,
  }
}

export default useAudioPlayer
