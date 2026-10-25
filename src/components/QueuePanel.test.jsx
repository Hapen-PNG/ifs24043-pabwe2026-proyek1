import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayer } from '../context/PlayerContext.jsx'
import QueuePanel from './QueuePanel.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({
  usePlayer: vi.fn(),
}))

describe('QueuePanel', () => {
  const removeFromQueue = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty queue message when there are no queued songs', () => {
    usePlayer.mockReturnValue({ queue: [], removeFromQueue })

    render(<QueuePanel />)

    expect(screen.getByText('Antrean kosong. Tambahkan lagu dari playlist.')).toBeInTheDocument()
  })

  it('renders queued songs and removes a selected song', () => {
    usePlayer.mockReturnValue({
      queue: [{ id: 7, title: 'Ruang Senja', artist: 'Nara', cover: '' }],
      removeFromQueue,
    })

    render(<QueuePanel />)

    expect(screen.getByText('Ruang Senja')).toBeInTheDocument()
    expect(screen.getByText('Nara')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hapus Ruang Senja dari antrean' }))

    expect(removeFromQueue).toHaveBeenCalledWith(7)
  })
})
