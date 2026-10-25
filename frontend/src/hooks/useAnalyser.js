import { useCallback, useEffect, useRef, useState } from 'react'

function useAnalyser(audioRef) {
  const audioContextRef = useRef(null)
  const sourceRef = useRef(null)
  const analyserRef = useRef(null)
  const isConnectedRef = useRef(false)
  const cleanupTimerRef = useRef(null)
  const [error, setError] = useState(null)

  const resumeAudioContext = useCallback(async () => {
    const audioContext = audioContextRef.current
    if (audioContext?.state === 'suspended') {
      await audioContext.resume()
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    if (cleanupTimerRef.current !== null) {
      window.clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    const AudioContextConstructor =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextConstructor) {
      setError('Web Audio API tidak didukung oleh browser ini.')
      return undefined
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextConstructor()
      }

      if (!sourceRef.current) {
        sourceRef.current =
          audioContextRef.current.createMediaElementSource(audio)
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 128
      }

      if (!isConnectedRef.current) {
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
        isConnectedRef.current = true
      }
      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Gagal menghubungkan audio ke Web Audio API.',
      )
    }

    return () => {
      cleanupTimerRef.current = window.setTimeout(() => {
        sourceRef.current?.disconnect()
        analyserRef.current?.disconnect()
        isConnectedRef.current = false

        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close()
        }
        audioContextRef.current = null
        sourceRef.current = null
        analyserRef.current = null
        cleanupTimerRef.current = null
      }, 0)
    }
  }, [audioRef])

  return { analyserRef, resumeAudioContext, analyserError: error }
}

export default useAnalyser
