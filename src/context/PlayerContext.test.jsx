import { configureStore } from '@reduxjs/toolkit'
import { act, cleanup, renderHook, screen, waitFor } from '@testing-library/react'
import { createElement, createRef } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerProvider, usePlayer } from './PlayerContext.jsx'
import activityReducer from '../features/activity/states/reducer.js'
import songsReducer from '../features/songs/states/reducer.js'

const mocks = vi.hoisted(() => ({
  addRecentApi: vi.fn(),
  getSongsApi: vi.fn(),
  addSong: vi.fn(),
  analyserError: '',
  audioPlay: vi.fn(),
  currentSong: { id: 1, title: 'Pagi', src: '/audio/pagi.mp3' },
  isPlaying: false,
  next: vi.fn(),
  pause: vi.fn(),
  play: vi.fn(),
  prev: vi.fn(),
  queue: [],
  resumeAudioContext: vi.fn(),
  selectSong: vi.fn(),
}))

vi.mock('../hooks/useAudioPlayer.js', () => ({
  default: vi.fn(() => ({
    audioRef: { current: { play: mocks.audioPlay } },
    currentSong: mocks.currentSong,
    isPlaying: mocks.isPlaying,
    next: mocks.next,
    pause: mocks.pause,
    play: mocks.play,
    prev: mocks.prev,
    queue: mocks.queue,
    selectSong: mocks.selectSong,
    addSong: mocks.addSong,
  })),
}))

vi.mock('../hooks/useAnalyser.js', () => ({
  default: vi.fn(() => ({
    analyserRef: createRef(),
    resumeAudioContext: mocks.resumeAudioContext,
    analyserError: mocks.analyserError,
  })),
}))

vi.mock('../hooks/usePlaybackStats.js', () => ({
  default: vi.fn(() => ({
    totalPlayCount: 3,
    topPlayedSongs: [],
    statsLoading: false,
    statsUnavailable: false,
  })),
}))

vi.mock('../features/songs/api/songApi.js', () => ({
  getSongsApi: mocks.getSongsApi,
}))

vi.mock('../features/activity/api/activityApi.js', () => ({
  addRecentApi: mocks.addRecentApi,
  getRecentApi: vi.fn(),
  getStatsApi: vi.fn(),
  recordPlayApi: vi.fn(),
  getSearchHistoryApi: vi.fn(),
  addSearchApi: vi.fn(),
  removeSearchApi: vi.fn(),
  clearSearchApi: vi.fn(),
}))

function renderPlayer({ user = null, songsStatus = 'succeeded', isPlaying = false, song = mocks.currentSong } = {}) {
  mocks.isPlaying = isPlaying
  mocks.currentSong = song
  const songs = [{ id: 1, title: 'Pagi', src: '/audio/pagi.mp3' }]
  const store = configureStore({
    reducer: {
      users: (state = { user }) => state,
      songs: songsReducer,
      activity: activityReducer,
    },
    preloadedState: {
      users: { user },
      songs: { items: songs, status: songsStatus, error: null, source: 'fallback' },
    },
  })
  const wrapper = ({ children }) => createElement(
    Provider,
    { store },
    createElement(PlayerProvider, null, children),
  )
  return { ...renderHook(() => usePlayer(), { wrapper }), store }
}

describe('PlayerContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.isPlaying = false
    mocks.currentSong = { id: 1, title: 'Pagi', src: '/audio/pagi.mp3' }
    mocks.queue = []
    mocks.analyserError = ''
    mocks.resumeAudioContext.mockResolvedValue(undefined)
    mocks.audioPlay.mockResolvedValue(undefined)
    mocks.getSongsApi.mockResolvedValue([{ id: 1, title: 'Pagi' }])
    mocks.addRecentApi.mockResolvedValue([{ id: 1, title: 'Pagi' }])
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('throws when usePlayer is outside PlayerProvider', () => {
    expect(() => renderHook(() => usePlayer())).toThrow(
      'usePlayer must be used within a PlayerProvider',
    )
  })

  it('provides player context, renders its audio element, and loads an idle catalog', async () => {
    const { result } = renderPlayer({ songsStatus: 'idle' })

    expect(result.current.currentSong).toEqual(mocks.currentSong)
    await waitFor(() => expect(mocks.getSongsApi).toHaveBeenCalled())
    await waitFor(() => expect(result.current.songsLoading).toBe(false))
  })

  it('shows the catalog loading status and backend fallback message', () => {
    const { result } = renderPlayer({ songsStatus: 'loading' })

    expect(result.current.songsLoading).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('Memuat lagu')
  })

  it('exposes an error message when the catalog request failed', () => {
    const { result } = renderPlayer({ songsStatus: 'failed' })

    expect(result.current.songsError).toBe(
      'Server lagu tidak tersedia; lagu bawaan sedang digunakan.',
    )
  })

  it('records valid currently playing tracks for an authenticated user', async () => {
    const song = { id: 2, title: 'Senja' }
    mocks.addRecentApi.mockResolvedValue([song])
    const { store } = renderPlayer({
      user: { id: 10 },
      isPlaying: true,
      song,
    })

    await waitFor(() => expect(mocks.addRecentApi).toHaveBeenCalledWith(2))
    expect(store.getState().activity.recent).toEqual([song])
  })

  it.each([
    ['no user', { user: null, isPlaying: true, song: mocks.currentSong }],
    ['paused', { user: { id: 2 }, isPlaying: false, song: mocks.currentSong }],
    ['no current song', { user: { id: 2 }, isPlaying: true, song: null }],
    ['invalid song id', { user: { id: 2 }, isPlaying: true, song: { id: 'not-a-number' } }],
  ])('does not record recent playback when %s', async (_label, options) => {
    renderPlayer(options)

    await act(async () => Promise.resolve())
    expect(mocks.addRecentApi).not.toHaveBeenCalled()
  })

  it('runs playback controls and respects selectSong shouldPlay', async () => {
    const { result } = renderPlayer()

    await act(async () => result.current.play())
    expect(mocks.resumeAudioContext).toHaveBeenCalled()
    expect(mocks.play).toHaveBeenCalled()

    mocks.isPlaying = true
    const paused = renderPlayer({ isPlaying: true })
    await act(async () => paused.result.current.toggle())
    expect(mocks.pause).toHaveBeenCalled()

    await act(async () => result.current.next())
    await act(async () => result.current.prev())
    expect(mocks.next).toHaveBeenCalled()
    expect(mocks.prev).toHaveBeenCalled()

    const resumeCalls = mocks.resumeAudioContext.mock.calls.length
    const selectedSong = { id: 3, title: 'Dipilih' }
    await act(async () => result.current.selectSong(selectedSong, false))
    expect(mocks.selectSong).toHaveBeenCalledWith(selectedSong, false)
    expect(mocks.resumeAudioContext).toHaveBeenCalledTimes(resumeCalls)
  })

  it('reports playback failures and suppresses the unavailable-audio console error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.play.mockRejectedValueOnce(new Error('decoder failed'))
    const { result } = renderPlayer()

    await act(async () => result.current.play())

    expect(result.current.playbackError).toBe('decoder failed')
    expect(consoleError).toHaveBeenCalledWith(
      'Aksi pemutaran audio gagal.',
      expect.any(Error),
    )

    mocks.play.mockRejectedValueOnce(new Error('File audio belum tersedia'))
    await act(async () => result.current.play())
    expect(result.current.playbackError).toBe('File audio belum tersedia')
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  it('adds uploaded audio and plays it, reporting upload playback failures', async () => {
    const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })
    const { result } = renderPlayer()
    const mediaPlay = vi.mocked(HTMLMediaElement.prototype.play)

    await act(async () => result.current.addSong(file))
    expect(mocks.addSong).toHaveBeenCalledWith(file)
    expect(mediaPlay).toHaveBeenCalled()

    mediaPlay.mockRejectedValueOnce('play failure')
    await act(async () => result.current.addSong(file))
    expect(result.current.playbackError).toBe('Pemutaran audio gagal.')
  })
})
