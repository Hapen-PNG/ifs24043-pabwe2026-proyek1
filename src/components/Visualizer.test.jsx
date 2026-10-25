import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Visualizer from './Visualizer.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

vi.mock('../context/PlayerContext.jsx', () => ({ usePlayer: vi.fn() }))

function createCanvasContext() {
  const gradient = { addColorStop: vi.fn() }
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    roundRect: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  }
}

describe('Visualizer', () => {
  let context
  let frame
  let observers

  beforeEach(() => {
    context = createCanvasContext()
    frame = undefined
    observers = []
    vi.stubGlobal('ResizeObserver', vi.fn(function ResizeObserver() {
      const observer = { observe: vi.fn(), disconnect: vi.fn() }
      observers.push(observer)
      return observer
    }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 100,
      height: 40,
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback
      return 10
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    usePlayer.mockReturnValue({
      analyserRef: { current: null },
      analyserError: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders and draws bar, wave, and circle visualizations from analyser data', () => {
    const analyser = {
      frequencyBinCount: 4,
      getByteFrequencyData: vi.fn((data) => data.set([0, 64, 128, 255])),
    }
    usePlayer.mockReturnValue({
      analyserRef: { current: analyser },
      analyserError: null,
    })
    const { unmount } = render(<Visualizer />)

    const canvas = screen.getByRole('img', { name: 'Visualisasi frekuensi audio' })
    expect(canvas).toBeInTheDocument()
    expect(observers[0].observe).toHaveBeenCalledWith(canvas)
    expect(context.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)

    act(() => frame())
    expect(analyser.getByteFrequencyData).toHaveBeenCalledOnce()
    expect(context.roundRect).toHaveBeenCalledTimes(4)

    fireEvent.click(screen.getByRole('button', { name: 'Gelombang' }))
    act(() => frame())
    expect(context.moveTo).toHaveBeenCalled()
    expect(context.lineTo).toHaveBeenCalled()
    expect(context.stroke).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Lingkaran' }))
    act(() => frame())
    expect(context.stroke).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Lingkaran' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    unmount()
    expect(observers).toHaveLength(3)
    observers.forEach((resizeObserver) => {
      expect(resizeObserver.disconnect).toHaveBeenCalledOnce()
    })
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(10)
  })

  it('reports analyser errors and skips drawing when canvas context is unavailable', () => {
    usePlayer.mockReturnValue({
      analyserRef: { current: null },
      analyserError: 'unsupported',
    })
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    render(<Visualizer />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Visualizer tidak tersedia: unsupported',
    )
    expect(ResizeObserver).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })
})
