import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  rolesService,
  type AppRole,
  type Permission,
} from "@/services/roles.service"
import { toast } from "sonner"
import KalorixiaLoader from "@/components/KalorixiaLoader"

const roles: AppRole[] = ["admin", "nutricionista", "paciente"]

export default function Roles() {
  const [perms, setPerms] = useState<Permission[]>([])
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [permissions, rolePermissions] = await Promise.all([
      rolesService.listPermissions(),
      rolesService.listRolePermissions(),
    ])
    setPerms(permissions)
    const m: Record<string, Set<string>> = {
      admin: new Set(),
      nutricionista: new Set(),
      paciente: new Set(),
    }
    rolePermissions.forEach((rp) => m[rp.role]?.add(rp.permission_code))
    setMatrix(m)
    setLoading(false)
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  const toggle = async (role: AppRole, code: string) => {
    try {
      await rolesService.togglePermission(role, code)
      toast.success("Permiso actualizado")
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <KalorixiaLoader />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-foreground">
          <ShieldCheck className="h-7 w-7 text-primary" /> Roles y permisos
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurá qué puede hacer cada tipo de usuario
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold">Permiso</th>
                {roles.map((r) => (
                  <th
                    key={r}
                    className="px-4 py-3 text-center font-semibold capitalize"
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((p) => (
                <tr
                  key={p.code}
                  className="border-b last:border-0 hover:bg-secondary/20"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {p.description || p.code}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.code}
                    </p>
                  </td>
                  {roles.map((r) => (
                    <td key={r} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={matrix[r]?.has(p.code) ?? false}
                        onCheckedChange={() => toggle(r, p.code)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
