import { beforeEach, describe, expect, it } from 'vitest'
import { clearLegacyData } from './legacyData.js'

describe('clearLegacyData', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes only the selected legacy keys and their user-scoped values', () => {
    localStorage.setItem('mini-music-player:favorites', 'old favorites')
    localStorage.setItem('mini-music-player:favorites:7', 'user favorites')
    localStorage.setItem('mini-music-player:recent:7', 'recent')
    localStorage.setItem('favorites', 'unrelated')

    clearLegacyData(['favorites'])

    expect(localStorage.getItem('mini-music-player:favorites')).toBeNull()
    expect(localStorage.getItem('mini-music-player:favorites:7')).toBeNull()
    expect(localStorage.getItem('mini-music-player:recent:7')).toBe('recent')
    expect(localStorage.getItem('favorites')).toBe('unrelated')
  })

  it('does nothing when the requested categories are empty', () => {
    localStorage.setItem('mini-music-player:recent', 'recent')

    clearLegacyData([])

    expect(localStorage.getItem('mini-music-player:recent')).toBe('recent')
  })
})
