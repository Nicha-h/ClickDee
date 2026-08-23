import { useLocation, useNavigate } from 'react-router-dom'

// react-router v6/v7 sets location.key to the literal 'default' when there's
// no actual history entry to go back to (first load / hard refresh / direct
// URL) — the standard way to detect that case.
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => {
    if (location.key === 'default') navigate(fallback)
    else navigate(-1)
  }
}
