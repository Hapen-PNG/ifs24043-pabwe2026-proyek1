import { Outlet } from 'react-router-dom'
import { PlayerProvider } from '../context/PlayerContext.jsx'
import { LibraryProvider } from '../context/LibraryContext.jsx'
import { ThemeProvider } from '../context/ThemeContext.jsx'

function ProtectedApp() {
  return (
    <PlayerProvider>
      <LibraryProvider>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </LibraryProvider>
    </PlayerProvider>
  )
}

export default ProtectedApp
