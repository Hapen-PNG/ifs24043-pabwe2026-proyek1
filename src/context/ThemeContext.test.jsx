import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'

function renderTheme(user) {
  const store = configureStore({
    reducer: { users: (state = { user }) => state },
  })
  const wrapper = ({ children }) => createElement(
    Provider,
    { store },
    createElement(ThemeProvider, null, children),
  )
  return renderHook(() => useTheme(), { wrapper })
}

describe('ThemeContext', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('defaults to dark mode for an anonymous user and toggles without persistence', () => {
    const { result } = renderTheme(null)

    expect(result.current.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('mini-music-player:theme:anonymous')).toBeNull()
  })

  it('loads and persists the current user theme', () => {
    localStorage.setItem('mini-music-player:theme:7', 'light')
    const { result } = renderTheme({ id: 7, email: 'user@example.com' })

    expect(result.current.theme).toBe('light')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('mini-music-player:theme:7')).toBe('dark')
  })

  it('uses email as the preference key when user id is unavailable', () => {
    localStorage.setItem('mini-music-player:theme:user@example.com', 'light')

    expect(renderTheme({ email: 'user@example.com' }).result.current.theme).toBe('light')
  })

  it('defaults invalid saved theme values to dark mode', () => {
    localStorage.setItem('mini-music-player:theme:anonymous', 'system')

    expect(renderTheme(null).result.current.theme).toBe('dark')
  })

  it('falls back to dark mode when localStorage cannot be read', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })

    expect(renderTheme(null).result.current.theme).toBe('dark')
    expect(error).toHaveBeenCalledWith(
      'Tidak dapat membaca tema dari localStorage.',
      expect.any(Error),
    )
  })

  it('keeps the theme usable when saving to localStorage fails', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage disabled')
    })
    const { result } = renderTheme({ id: 7 })

    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('light')
    expect(error).toHaveBeenCalledWith(
      'Tidak dapat menyimpan tema ke localStorage.',
      expect.any(Error),
    )
  })

  it('throws when useTheme is outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme harus digunakan di dalam ThemeProvider.',
    )
  })
})
