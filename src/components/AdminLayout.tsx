import { Outlet, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import AdminSidebar from "@/components/AdminSidebar"
import { useAuth } from "@/hooks/use-auth"

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="surface-raised sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              className="gap-1.5 rounded-full border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
