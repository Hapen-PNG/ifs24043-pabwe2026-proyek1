import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useAudioPlayer from './useAudioPlayer.js'

const songs = [
  { id: 1, title: 'Pagi', src: '/pagi.mp3', cover: '/pagi.jpg' },
  { id: 2, title: 'Siang', src: '/siang.mp3', cover: '/siang.jpg' },
  { id: 3, title: 'Malam', src: '/malam.mp3', cover: '/malam.jpg' },
]
const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

function makeAudio() {
  const listeners = new Map()
  const audio = {
    paused: true,
    duration: 120,
    currentTime: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    src: '',
    play: vi.fn(function play() {
      this.paused = false
      listeners.get('play')?.()
      return Promise.resolve()
    }),
    pause: vi.fn(function pause() {
      this.paused = true
      listeners.get('pause')?.()
    }),
    load: vi.fn(),
    addEventListener: vi.fn((type, callback) => listeners.set(type, callback)),
    removeEventListener: vi.fn((type) => listeners.delete(type)),
    removeAttribute: vi.fn((attribute) => {
      if (attribute === 'src') audio.src = ''
    }),
    emit: (type) => listeners.get(type)?.(),
  }
  return audio
}

function renderPlayer({ songList = songs, userId = 4, audio = makeAudio() } = {}) {
  const rendered = renderHook(() => {
    const player = useAudioPlayer(songList, userId)
    player.audioRef.current = audio
    return player
  })
  return { ...rendered, audio }
}

describe('useAudioPlayer', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'audio/mpeg' },
    }))
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:uploaded-track'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
    } else {
      delete URL.createObjectURL
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL)
    } else {
      delete URL.revokeObjectURL
    }
  })

  it('loads and persists per-user preferences with bounded defaults', () => {
    localStorage.setItem('mini-music-player:volume:4', '1.5')
    localStorage.setItem('mini-music-player:shuffle:4', 'true')
    localStorage.setItem('mini-music-player:repeat:4', 'invalid')
    const { result } = renderPlayer()

    expect(result.current.currentSong).toEqual(songs[0])
    expect(result.current.volume).toBe(1)
    expect(result.current.isShuffle).toBe(true)
    expect(result.current.repeatMode).toBe('off')

    act(() => result.current.setVolume(0.25))
    act(() => result.current.toggleShuffle())
    act(() => result.current.cycleRepeat())
    expect(localStorage.getItem('mini-music-player:volume:4')).toBe('0.25')
    expect(localStorage.getItem('mini-music-player:shuffle:4')).toBe('false')
    expect(localStorage.getItem('mini-music-player:repeat:4')).toBe('one')
  })

  it('defaults shuffle to false and enables it on the first toggle', () => {
    const { result } = renderPlayer()

    expect(result.current.isShuffle).toBe(false)
    act(() => result.current.toggleShuffle())
    expect(result.current.isShuffle).toBe(true)
  })

  it('reads a stored false shuffle preference as a boolean', () => {
    localStorage.setItem('mini-music-player:shuffle:4', 'false')
    const { result } = renderPlayer()

    expect(result.current.isShuffle).toBe(false)
    act(() => result.current.toggleShuffle())
    expect(result.current.isShuffle).toBe(true)
  })

  it('loads anonymous preferences and falls back when localStorage throws', () => {
    localStorage.setItem('mini-music-player:volume:anonymous', '0.4')
    localStorage.setItem('mini-music-player:shuffle:anonymous', 'true')
    const { result: anonymousResult } = renderPlayer({ userId: null })
    expect(anonymousResult.current.volume).toBe(0.4)
    expect(anonymousResult.current.isShuffle).toBe(true)

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderPlayer()

    expect(result.current.volume).toBe(1)
    expect(result.current.isShuffle).toBe(false)
    expect(result.current.repeatMode).toBe('off')
    expect(consoleError).toHaveBeenCalled()
    getItem.mockRestore()
  })

  it('continues when persisting preferences throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    const { result } = renderPlayer()

    act(() => result.current.setVolume(0.5))
    expect(result.current.volume).toBe(0.5)
    expect(consoleError).toHaveBeenCalled()
  })

  it('prepares available audio, plays, pauses, toggles, and updates metadata events', async () => {
    const { result, audio } = renderPlayer()

    await act(async () => result.current.play())
    expect(fetch).toHaveBeenCalledWith('/pagi.mp3', { method: 'HEAD' })
    expect(audio.src).toBe('/pagi.mp3')
    expect(audio.load).toHaveBeenCalledOnce()
    expect(audio.play).toHaveBeenCalledOnce()
    expect(result.current.isPlaying).toBe(true)

    act(() => {
      audio.currentTime = 36
      audio.emit('timeupdate')
      audio.duration = 120
      audio.emit('loadedmetadata')
    })
    expect(result.current.currentTime).toBe(36)
    expect(result.current.duration).toBe(120)

    await act(async () => result.current.toggle())
    expect(audio.pause).toHaveBeenCalled()
    expect(result.current.isPlaying).toBe(false)
    await act(async () => result.current.toggle())
    expect(result.current.isPlaying).toBe(true)
  })

  it('rejects unavailable sources, caches the failure, and permits blob audio', async () => {
    const { result, audio } = renderPlayer()
    fetch.mockResolvedValueOnce({
      ok: false,
      headers: { get: () => 'text/html' },
    })

    await expect(act(async () => result.current.play())).rejects.toThrow('File audio belum tersedia')
    await expect(act(async () => result.current.play())).rejects.toThrow('File audio belum tersedia')
    expect(fetch).toHaveBeenCalledTimes(1)

    const uploaded = { ...songs[0], src: 'blob:local-audio' }
    await act(async () => result.current.selectSong(uploaded))
    expect(audio.src).toBe('blob:local-audio')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handles a rejected HEAD request and operations with no audio element', async () => {
    const audio = makeAudio()
    const { result } = renderPlayer({ audio: null })
    await act(async () => result.current.play())
    await act(async () => result.current.selectSong(1))
    expect(fetch).not.toHaveBeenCalled()

    const withAudio = renderPlayer({ audio })
    fetch.mockRejectedValueOnce(new Error('network unavailable'))
    await expect(act(async () => withAudio.result.current.play()))
      .rejects.toThrow('File audio belum tersedia')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('selects valid songs, ignores unknown songs, and navigates through the queue', async () => {
    const { result, audio } = renderPlayer()

    await act(async () => result.current.selectSong(2, false))
    expect(result.current.currentSong).toEqual(songs[1])
    expect(audio.play).not.toHaveBeenCalled()
    await act(async () => result.current.selectSong({ id: 99, src: '/unknown.mp3' }))
    expect(result.current.currentSong).toEqual(songs[1])

    act(() => result.current.enqueue(songs[2]))
    act(() => result.current.enqueue(songs[2]))
    act(() => result.current.enqueue({ id: 99 }))
    expect(result.current.queue).toEqual([songs[2]])
    await act(async () => result.current.next())
    expect(result.current.currentSong).toEqual(songs[2])
    expect(result.current.queue).toEqual([])

    act(() => result.current.enqueue(songs[0]))
    act(() => result.current.removeFromQueue(1))
    expect(result.current.queue).toEqual([])
    act(() => result.current.enqueue(songs[0]))
    act(() => result.current.clearQueue())
    expect(result.current.queue).toEqual([])
  })

  it('wraps previous and next playback and stops automatic playback at the end', async () => {
    const { result: previousResult } = renderPlayer({ audio: null })
    await act(async () => previousResult.current.selectSong(2, false))
    await act(async () => previousResult.current.prev())
    expect(previousResult.current.currentSong).toEqual(songs[0])

    const { result: nextResult } = renderPlayer({ audio: null })
    await act(async () => nextResult.current.selectSong(2, false))
    await act(async () => nextResult.current.next())
    expect(nextResult.current.currentSong).toEqual(songs[2])

    const { result: endResult } = renderPlayer({ audio: null })
    await act(async () => endResult.current.selectSong(3, false))
    act(() => endResult.current.next(true))
    expect(endResult.current.currentSong).toEqual(songs[2])
    expect(endResult.current.isPlaying).toBe(false)

    act(() => endResult.current.cycleRepeat())
    expect(endResult.current.repeatMode).toBe('one')
    act(() => endResult.current.cycleRepeat())
    expect(endResult.current.repeatMode).toBe('all')
    await act(async () => endResult.current.next(true))
    expect(endResult.current.currentSong).toEqual(songs[0])
  })

  it('handles shuffle queue navigation and repeat-one ended events', async () => {
    const { result } = renderPlayer({ audio: null })

    act(() => result.current.toggleShuffle())
    await waitFor(() => expect(result.current.isShuffle).toBe(true))
    await act(async () => result.current.next())
    expect(result.current.currentSong.id).not.toBe(songs[0].id)
    await act(async () => result.current.prev())
    expect(result.current.currentSong).toEqual(songs[0])

    const { result: repeatResult, audio } = renderPlayer()
    act(() => repeatResult.current.cycleRepeat())
    audio.currentTime = 55
    await act(async () => audio.emit('ended'))
    expect(audio.currentTime).toBe(0)
    expect(repeatResult.current.currentTime).toBe(0)
    expect(audio.play).toHaveBeenCalled()
  })

  it('repeats a one-song shuffle queue and stops at its end when repeat is off', async () => {
    localStorage.setItem('mini-music-player:shuffle:4', 'true')
    const singleSong = [songs[0]]
    const { result } = renderPlayer({ songList: singleSong, audio: null })

    act(() => result.current.next(true))
    expect(result.current.currentSong).toEqual(singleSong[0])
    act(() => result.current.cycleRepeat())
    act(() => result.current.cycleRepeat())
    await act(async () => result.current.next(true))
    expect(result.current.currentSong).toEqual(singleSong[0])
  })

  it('uses safe fallbacks for duration, mute, and uploaded filename and cover', () => {
    const { result, audio } = renderPlayer({ songList: [], audio: null })

    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(true)
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(false)
    act(() => result.current.seek(10))

    const emptyTitleFile = new File(['audio'], '.mp3', { type: '' })
    let uploaded
    act(() => {
      uploaded = result.current.addSong(emptyTitleFile)
    })
    expect(uploaded.title).toBe('.mp3')
    expect(uploaded.cover).toBe('')
  })

  it('updates volume from audio events and resets non-finite metadata duration', async () => {
    const { result, audio } = renderPlayer()

    act(() => {
      audio.volume = 0.6
      audio.muted = true
      audio.emit('volumechange')
      audio.duration = Number.POSITIVE_INFINITY
      audio.emit('loadedmetadata')
    })

    expect(result.current.volume).toBe(0.6)
    expect(result.current.isMuted).toBe(true)
    expect(result.current.duration).toBe(0)
  })

  it('bounds seeking and volume, toggles mute, and validates playback rates', () => {
    const { result, audio } = renderPlayer()

    act(() => result.current.seek(150))
    expect(audio.currentTime).toBe(120)
    expect(result.current.currentTime).toBe(120)
    act(() => result.current.seek(-10))
    expect(audio.currentTime).toBe(0)
    act(() => result.current.seek(Number.NaN))
    expect(audio.currentTime).toBe(0)

    act(() => result.current.setVolume(2))
    expect(result.current.volume).toBe(1)
    act(() => result.current.setVolume(-1))
    expect(result.current.volume).toBe(0)
    expect(audio.muted).toBe(false)
    act(() => result.current.setVolume(Number.NaN))
    expect(result.current.volume).toBe(0)
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(true)
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(false)

    act(() => result.current.setPlaybackRate(1.5))
    expect(result.current.playbackRate).toBe(1.5)
    expect(audio.playbackRate).toBe(1.5)
    act(() => result.current.setPlaybackRate(3))
    expect(result.current.playbackRate).toBe(1.5)
  })

  it('adds valid uploaded files, rejects invalid ones, and releases URLs on user change', async () => {
    const audio = makeAudio()
    const { result, rerender } = renderHook(
      ({ userId }) => {
        const player = useAudioPlayer(songs, userId)
        player.audioRef.current = audio
        return player
      },
      { initialProps: { userId: 4 } },
    )
    const file = new File(['track'], 'own-song.mp3', { type: 'audio/mpeg' })

    let uploaded
    act(() => {
      uploaded = result.current.addSong(file)
    })
    expect(uploaded.title).toBe('own-song')
    expect(uploaded.src).toBe('blob:uploaded-track')
    expect(result.current.currentSong).toEqual(uploaded)
    expect(audio.src).toBe('blob:uploaded-track')

    expect(() => result.current.addSong(new File(['x'], 'notes.txt', { type: 'text/plain' })))
      .toThrow('Pilih file audio yang valid.')
    expect(() => result.current.addSong({ name: 'bad.mp3', type: 'audio/mpeg' }))
      .toThrow('Pilih file audio yang valid.')

    rerender({ userId: 5 })
    await waitFor(() => expect(result.current.currentSong).toEqual(songs[0]))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:uploaded-track')
  })

  it('resets playback settings when the account changes and removes audio listeners', async () => {
    const audio = makeAudio()
    const { result, rerender, unmount } = renderHook(
      ({ userId, songList }) => {
        const player = useAudioPlayer(songList, userId)
        player.audioRef.current = audio
        return player
      },
      { initialProps: { userId: 4, songList: songs } },
    )
    act(() => result.current.setVolume(0.3))
    act(() => result.current.cycleRepeat())
    await act(async () => result.current.selectSong(2, false))

    rerender({ userId: 5, songList: songs })
    await waitFor(() => expect(result.current.currentSong).toEqual(songs[0]))
    expect(result.current.volume).toBe(1)
    expect(result.current.repeatMode).toBe('off')
    expect(audio.removeAttribute).toHaveBeenCalledWith('src')

    unmount()
    expect(audio.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function))
    expect(audio.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function))
  })

  it('handles empty catalogs and audio elements without performing invalid operations', () => {
    const { result } = renderPlayer({ songList: [], audio: null })

    expect(result.current.currentSong).toBeNull()
    act(() => {
      result.current.pause()
      result.current.seek(10)
      result.current.next()
      result.current.prev()
    })
  })
})
