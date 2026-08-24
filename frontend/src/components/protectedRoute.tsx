import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'

function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <span className="bg-amalfi h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full" />
          <span className="bg-citrus h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full [animation-delay:0.12s]" />
          <span className="bg-sea h-3.5 w-3.5 animate-[bounce-dot_0.6s_ease-in-out_infinite] rounded-full [animation-delay:0.24s]" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
