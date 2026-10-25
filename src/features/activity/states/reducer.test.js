import { describe, expect, it } from 'vitest'
import { login, logout } from '../../auth/states/action.js'
import {
  addSearchHistory,
  clearSearchHistory,
  fetchRecent,
  fetchSearchHistory,
  fetchStats,
  recordPlay,
  recordRecent,
  removeSearchHistory,
} from './action.js'
import activityReducer from './reducer.js'

const initialState = {
  recent: [],
  stats: { totalPlays: 0, topPlayed: [] },
  searchHistory: [],
  recentStatus: 'idle',
  statsStatus: 'idle',
  searchHistoryStatus: 'idle',
}

describe('activity reducer', () => {
  it('returns its initial state', () => {
    expect(activityReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it.each([
    ['login.fulfilled', login.fulfilled({ token: 'token', user: {} }, 'login-id', {})],
    ['logout.fulfilled', logout.fulfilled(undefined, 'logout-id')],
    ['logout.rejected', logout.rejected({ message: 'Network error' }, 'logout-id')],
  ])('resets activity on %s', (_label, action) => {
    expect(
      activityReducer(
        {
          recent: [{ id: 1 }],
          stats: { totalPlays: 3, topPlayed: [{ id: 1, count: 3 }] },
          searchHistory: [{ id: 1, term: 'Lagu' }],
          recentStatus: 'failed',
          statsStatus: 'failed',
          searchHistoryStatus: 'failed',
        },
        action,
      ),
    ).toEqual(initialState)
  })

  it('handles fetchRecent pending, fulfilled, and rejected actions', () => {
    const pending = activityReducer(initialState, fetchRecent.pending('recent-id'))
    expect(pending.recentStatus).toBe('loading')

    const recent = [{ id: 4, title: 'Ruang' }]
    const fulfilled = activityReducer(
      pending,
      fetchRecent.fulfilled(recent, 'recent-id'),
    )
    expect(fulfilled).toMatchObject({ recent, recentStatus: 'succeeded' })

    const rejected = activityReducer(
      fulfilled,
      fetchRecent.rejected({ message: 'Network error' }, 'recent-id'),
    )
    expect(rejected).toMatchObject({ recent: [], recentStatus: 'failed' })
  })

  it('handles recordRecent fulfilled and rejected actions', () => {
    const recent = [{ id: 1 }, { id: 2 }]
    const fulfilled = activityReducer(
      initialState,
      recordRecent.fulfilled(recent, 'record-recent-id', 1),
    )
    expect(fulfilled.recent).toEqual(recent)

    const rejected = activityReducer(
      fulfilled,
      recordRecent.rejected({ message: 'Network error' }, 'record-recent-id', 1),
    )
    expect(rejected).toMatchObject({
      recent: [{ id: 2 }],
      recentStatus: 'failed',
    })
  })

  it('updates play counts optimistically and rolls them back on rejection', () => {
    const song = { id: 7, title: 'Malam' }
    const pending = activityReducer(
      initialState,
      recordPlay.pending('record-play-id', song),
    )
    expect(pending.stats).toEqual({
      totalPlays: 1,
      topPlayed: [{ ...song, count: 1 }],
    })

    const rejected = activityReducer(
      pending,
      recordPlay.rejected({ message: 'Network error' }, 'record-play-id', song),
    )
    expect(rejected.stats).toEqual({ totalPlays: 0, topPlayed: [] })
    expect(rejected.statsStatus).toBe('failed')
  })

  it('handles fetchStats pending, fulfilled, and rejected actions', () => {
    const pending = activityReducer(initialState, fetchStats.pending('stats-id'))
    expect(pending.statsStatus).toBe('loading')

    const stats = { totalPlays: 9, topPlayed: [{ id: 4, count: 5 }] }
    const fulfilled = activityReducer(pending, fetchStats.fulfilled(stats, 'stats-id'))
    expect(fulfilled).toMatchObject({ stats, statsStatus: 'succeeded' })

    const rejected = activityReducer(
      fulfilled,
      fetchStats.rejected({ message: 'Network error' }, 'stats-id'),
    )
    expect(rejected).toMatchObject({
      stats: { totalPlays: 0, topPlayed: [] },
      statsStatus: 'failed',
    })
  })

  it('handles fetchSearchHistory pending, fulfilled, and rejected actions', () => {
    const pending = activityReducer(
      initialState,
      fetchSearchHistory.pending('search-history-id'),
    )
    expect(pending.searchHistoryStatus).toBe('loading')

    const history = [{ id: 1, term: 'Pagi' }]
    const fulfilled = activityReducer(
      pending,
      fetchSearchHistory.fulfilled(history, 'search-history-id'),
    )
    expect(fulfilled).toMatchObject({
      searchHistory: history,
      searchHistoryStatus: 'succeeded',
    })

    const rejected = activityReducer(
      fulfilled,
      fetchSearchHistory.rejected({ message: 'Network error' }, 'search-history-id'),
    )
    expect(rejected).toMatchObject({
      searchHistory: [],
      searchHistoryStatus: 'failed',
    })
  })

  it.each([
    ['addSearchHistory', addSearchHistory, 'add-history-id', 'Pagi'],
    ['removeSearchHistory', removeSearchHistory, 'remove-history-id', 1],
    ['clearSearchHistory', clearSearchHistory, 'clear-history-id', undefined],
  ])('handles %s fulfilled and rejected actions', (_label, actionCreator, requestId, arg) => {
    const history = [{ id: 1, term: 'Pagi' }, { id: 2, term: 'Malam' }]
    const fulfilledPayload = _label === 'addSearchHistory' ? history : undefined
    const fulfilled = activityReducer(
      { ...initialState, searchHistory: history },
      actionCreator.fulfilled(fulfilledPayload, requestId, arg),
    )

    if (_label === 'addSearchHistory') {
      expect(fulfilled.searchHistory).toEqual(history)
    } else if (_label === 'removeSearchHistory') {
      expect(fulfilled.searchHistory).toEqual([{ id: 2, term: 'Malam' }])
    } else {
      expect(fulfilled.searchHistory).toEqual([])
    }
    expect(fulfilled.searchHistoryStatus).toBe('succeeded')

    const rejected = activityReducer(
      fulfilled,
      actionCreator.rejected({ message: 'Network error' }, requestId, arg),
    )
    expect(rejected.searchHistoryStatus).toBe('failed')
  })
})
