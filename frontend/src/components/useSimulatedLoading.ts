import { useEffect, useState } from 'react'

// Stands in for a real fetch-loading flag until an API client is wired up.
export function useSimulatedLoading(delayMs = 700) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), delayMs)
    return () => clearTimeout(timeout)
  }, [delayMs])

  return isLoading
}
