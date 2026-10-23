import { useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

function Visualizer() {
  const canvasRef = useRef(null)
  const { analyserRef, analyserError } = usePlayer()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    let animationFrameId
    let frequencyData

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio))
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
    resizeCanvas()

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()
      context.clearRect(0, 0, width, height)

      const analyser = analyserRef.current
      if (analyser) {
        if (!frequencyData || frequencyData.length !== analyser.frequencyBinCount) {
          frequencyData = new Uint8Array(analyser.frequencyBinCount)
        }
        analyser.getByteFrequencyData(frequencyData)

        const barCount = frequencyData.length
        const gap = 3
        const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount)
        const gradient = context.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0, '#8b5cf6')
        gradient.addColorStop(0.55, '#c084fc')
        gradient.addColorStop(1, '#67e8f9')
        context.fillStyle = gradient

        for (let index = 0; index < barCount; index += 1) {
          const barHeight = Math.max(
            2,
            (frequencyData[index] / 255) * height,
          )
          const x = index * (barWidth + gap)
          context.beginPath()
          context.roundRect(x, height - barHeight, barWidth, barHeight, 3)
          context.fill()
        }
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
    }
  }, [analyserRef])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-label="Visualisasi frekuensi audio"
        role="img"
        className="h-24 w-full"
      />
      {analyserError && (
        <p role="status" className="px-2 pb-2 text-xs text-amber-300">
          Visualizer tidak tersedia: {analyserError}
        </p>
      )}
    </>
  )
}

export default Visualizer
