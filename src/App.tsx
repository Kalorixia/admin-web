import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { ConfirmProvider } from "@/components/ConfirmDialog"
import RequireAuth from "@/routes/RequireAuth"
import AdminLayout from "@/components/AdminLayout"
import Login from "@/pages/Login"
import NotFound from "@/pages/NotFound"
import Dashboard from "@/pages/Dashboard"
import Users from "@/pages/Users"
import Nutritionists from "@/pages/Nutritionists"
import Recipes from "@/pages/Recipes"
import RecipeEditor from "@/pages/RecipeEditor"
import Subscriptions from "@/pages/Subscriptions"
import SubscriptionPlans from "@/pages/SubscriptionPlans"
import Audit from "@/pages/Audit"
import Roles from "@/pages/Roles"

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} richColors />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="usuarios" element={<Users />} />
                <Route path="nutricionistas" element={<Nutritionists />} />
                <Route path="recetas" element={<Recipes />} />
                <Route path="recetas/nueva" element={<RecipeEditor />} />
                <Route path="recetas/:id" element={<RecipeEditor />} />
                <Route path="suscripciones" element={<Subscriptions />} />
                <Route path="planes" element={<SubscriptionPlans />} />
                <Route path="auditoria" element={<Audit />} />
                <Route path="roles" element={<Roles />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
