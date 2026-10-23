import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const ThemeContext = createContext(null)

function getThemeKey(user) {
  return `mini-music-player:theme:${user?.id ?? user?.email ?? 'anonymous'}`
}

function getSavedTheme(key) {
  try {
    return window.localStorage.getItem(key) === 'light'
      ? 'light'
      : 'dark'
  } catch (error) {
    console.error('Tidak dapat membaca tema dari localStorage.', error)
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const themeKey = getThemeKey(user)
  const [themeState, setThemeState] = useState(() => ({
    key: themeKey,
    theme: getSavedTheme(themeKey),
  }))
  const theme = themeState.key === themeKey ? themeState.theme : getSavedTheme(themeKey)

  useEffect(() => {
    setThemeState({ key: themeKey, theme: getSavedTheme(themeKey) })
  }, [themeKey])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (user) {
      try {
        window.localStorage.setItem(themeKey, next)
      } catch (error) {
        console.error('Tidak dapat menyimpan tema ke localStorage.', error)
      }
    }
    setThemeState({ key: themeKey, theme: next })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const themeContext = useContext(ThemeContext)
  if (!themeContext) {
    throw new Error('useTheme harus digunakan di dalam ThemeProvider.')
  }
  return themeContext
}
