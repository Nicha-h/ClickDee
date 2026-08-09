import { useEffect, useRef, useState, type RefObject } from 'react'

const HIDE_THRESHOLD = 80

function useScrollHidden(containerRef: RefObject<HTMLDivElement | null>) {
  const [hidden, setHidden] = useState(false)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const top = container.scrollTop
      if (top < HIDE_THRESHOLD) {
        setHidden(false)
      } else if (top > lastScrollTop.current) {
        setHidden(true)
      } else if (top < lastScrollTop.current) {
        setHidden(false)
      }
      lastScrollTop.current = top
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  return hidden
}

export default useScrollHidden
