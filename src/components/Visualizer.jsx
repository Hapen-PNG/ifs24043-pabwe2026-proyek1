import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

function Visualizer() {
  const canvasRef = useRef(null)
  const { analyserRef, analyserError } = usePlayer()
  const [style, setStyle] = useState('bar')

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

        const gradient = context.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0, '#8b5cf6')
        gradient.addColorStop(0.55, '#c084fc')
        gradient.addColorStop(1, '#67e8f9')
        context.strokeStyle = gradient
        context.fillStyle = gradient
        context.lineWidth = 3

        if (style === 'bar') {
          const gap = 3
          const barCount = frequencyData.length
          const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount)
          for (let index = 0; index < barCount; index += 1) {
            const barHeight = Math.max(2, (frequencyData[index] / 255) * height)
            const x = index * (barWidth + gap)
            context.beginPath()
            context.roundRect(x, height - barHeight, barWidth, barHeight, 3)
            context.fill()
          }
        } else if (style === 'wave') {
          context.beginPath()
          frequencyData.forEach((value, index) => {
            const x = (index / Math.max(1, frequencyData.length - 1)) * width
            const y = height - (value / 255) * height
            if (index === 0) context.moveTo(x, y)
            else context.lineTo(x, y)
          })
          context.stroke()
        } else {
          const centerX = width / 2
          const centerY = height / 2
          const radius = Math.min(width, height) * 0.16
          const barCount = frequencyData.length
          for (let index = 0; index < barCount; index += 1) {
            const angle = (index / barCount) * Math.PI * 2
            const innerRadius = radius
            const outerRadius = radius + (frequencyData[index] / 255) * radius * 1.5
            context.beginPath()
            context.moveTo(
              centerX + Math.cos(angle) * innerRadius,
              centerY + Math.sin(angle) * innerRadius,
            )
            context.lineTo(
              centerX + Math.cos(angle) * outerRadius,
              centerY + Math.sin(angle) * outerRadius,
            )
            context.stroke()
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
    }
  }, [analyserRef, style])

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-1">
        {[
          ['bar', 'Bar'],
          ['wave', 'Gelombang'],
          ['circle', 'Lingkaran'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStyle(value)}
            aria-pressed={style === value}
            className={`rounded-lg px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
              style === value
                ? 'bg-violet-500/20 text-violet-200'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
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
    </div>
  )
}

export default Visualizer
