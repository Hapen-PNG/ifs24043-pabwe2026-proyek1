import { useEffect, useState } from 'react'

function useSleepTimer(pause) {
  const [deadline, setDeadline] = useState(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!deadline) return undefined

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      if (remaining === 0) {
        setDeadline(null)
        pause()
      }
    }

    updateRemaining()
    const intervalId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(intervalId)
  }, [deadline, pause])

  const start = (minutes) => {
    if (![15, 30, 60].includes(minutes)) return
    setRemainingSeconds(minutes * 60)
    setDeadline(Date.now() + minutes * 60 * 1000)
  }

  const cancel = () => {
    setDeadline(null)
    setRemainingSeconds(0)
  }

  return { remainingSeconds, start, cancel }
}

export default useSleepTimer
