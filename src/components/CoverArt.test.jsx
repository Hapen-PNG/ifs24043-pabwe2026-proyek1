import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CoverArt from './CoverArt.jsx'

const song = {
  id: 1,
  title: 'Senja Terakhir',
  cover: '/images/senja.svg',
}

describe('CoverArt', () => {
  it('renders the image when a cover path is available', () => {
    render(<CoverArt song={song} />)

    expect(screen.getByRole('img', { name: 'Cover Senja Terakhir' })).toHaveAttribute(
      'src',
      '/images/senja.svg',
    )
  })

  it('shows the initials fallback when the cover path is empty', () => {
    render(<CoverArt song={{ ...song, cover: '' }} />)

    expect(
      screen.getByRole('img', { name: 'Cover Senja Terakhir belum tersedia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ST')).toBeInTheDocument()
  })

  it('shows the initials fallback when the cover image fails to load', () => {
    render(<CoverArt song={song} />)

    fireEvent.error(screen.getByRole('img', { name: 'Cover Senja Terakhir' }))

    expect(
      screen.getByRole('img', { name: 'Cover Senja Terakhir belum tersedia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ST')).toBeInTheDocument()
  })
})
