import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import KalorixiaLoader from "@/components/KalorixiaLoader"

export default function RequireAuth() {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <KalorixiaLoader />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
