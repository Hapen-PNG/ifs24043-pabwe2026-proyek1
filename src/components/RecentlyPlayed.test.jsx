import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from '../context/PlayerContext.jsx'
import RecentlyPlayed from './RecentlyPlayed.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

describe('RecentlyPlayed', () => {
  const selectSong = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    usePlayer.mockReturnValue({ selectSong })
  })

  it('renders the playback history heading and songs', () => {
    const songs = [{ id: 4, title: 'Pagi Bersemi' }]

    render(<RecentlyPlayed songs={songs} />)

    expect(screen.getByRole('heading', { name: 'Terakhir Diputar' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pagi Bersemi' }))
    expect(selectSong).toHaveBeenCalledWith(songs[0])
  })

  it('shows the loading status', () => {
    render(<RecentlyPlayed songs={[]} loading />)

    expect(screen.getByRole('status', { name: 'Memuat riwayat pemutaran' })).toBeInTheDocument()
  })

  it('shows an unavailable message when history could not be loaded', () => {
    render(<RecentlyPlayed songs={[]} unavailable />)

    expect(screen.getByText('Data belum dapat dimuat')).toBeInTheDocument()
  })
})
