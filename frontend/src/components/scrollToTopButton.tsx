import { useEffect, useState, type RefObject } from 'react'
import { ArrowUp } from 'lucide-react'
import Portal from '@/components/portal'

const SCROLL_THRESHOLD = 300

function ScrollToTopButton({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setVisible(container.scrollTop > SCROLL_THRESHOLD)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  if (!visible) return null

  return (
    <Portal>
      <button
        type="button"
        onClick={() =>
          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }
        aria-label="Scroll to top"
        className="border-amalfi fixed right-8 bottom-8 z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:scale-105 hover:cursor-pointer"
      >
        <ArrowUp className="text-amalfi h-5 w-5" />
      </button>
    </Portal>
  )
}

export default ScrollToTopButton
