import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedApp from './ProtectedApp.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({
  PlayerProvider: ({ children }) => createElement('div', { 'data-provider': 'player' }, children),
}))
vi.mock('../context/LibraryContext.jsx', () => ({
  LibraryProvider: ({ children }) => createElement('div', { 'data-provider': 'library' }, children),
}))
vi.mock('../context/ThemeContext.jsx', () => ({
  ThemeProvider: ({ children }) => createElement('div', { 'data-provider': 'theme' }, children),
}))

describe('ProtectedApp', () => {
  it('composes the providers around the nested route content', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedApp />}>
            <Route path="/protected" element={<p>Protected content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(document.querySelector('[data-provider="player"] [data-provider="library"] [data-provider="theme"]'))
      .toContainElement(screen.getByText('Protected content'))
  })
})
