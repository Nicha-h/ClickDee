import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

export default Portal
