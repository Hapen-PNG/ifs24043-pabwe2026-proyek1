import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import NotFound from './NotFound.jsx'

vi.mock('../context/ThemeContext.jsx', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

describe('NotFound', () => {
  it('renders the not-found message and navigation back to home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
