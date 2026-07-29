import { useEffect, useState } from "react"
import { Loader2, Lock, Unlock, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  usersService,
  type UserDetail,
  type UserProfile,
} from "@/services/users.service"
import { toast } from "sonner"

export default function Users() {
  const [rows, setRows] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [viewing, setViewing] = useState<UserDetail | UserProfile | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [blockTarget, setBlockTarget] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setRows(await usersService.list())
    setLoading(false)
  }
  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  const doToggleBlock = async () => {
    if (!blockTarget) return
    setSaving(true)
    const newBlocked = blockTarget.activo
    try {
      await usersService.setBlocked(blockTarget.id_usuario, newBlocked)
      toast.success(newBlocked ? "Usuario bloqueado" : "Usuario desbloqueado")
      setBlockTarget(null)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const viewProfile = async (row: UserProfile) => {
    setViewLoading(true)
    setViewing(row)
    try {
      const detail = await usersService.getDetail(row.id_usuario)
      setViewing(detail)
    } catch {
      // se queda con los datos parciales de la fila si el detalle falla
    } finally {
      setViewLoading(false)
    }
  }

  const filtered = rows.filter(
    (r) =>
      !query.trim() ||
      r.email.toLowerCase().includes(query.toLowerCase()) ||
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Gestión de usuarios
        </h1>
        <p className="text-sm text-muted-foreground">
          Administrá las cuentas del sistema
        </p>
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por email o nombre…"
        className="max-w-md rounded-xl"
      />
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Card className="divide-y divide-border">
          {filtered.map((r) => (
            <div key={r.id_usuario} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.nombre} {r.apellido}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.email}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.roles.map((rl) => (
                    <Badge key={rl} variant="secondary" className="text-[10px]">
                      {rl}
                    </Badge>
                  ))}
                  {!r.activo && (
                    <Badge variant="destructive" className="text-[10px]">
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => viewProfile(r)}
                className="gap-1 rounded-xl"
              >
                <Eye className="h-4 w-4" /> Ver perfil
              </Button>
              <Button
                size="sm"
                variant={!r.activo ? "default" : "outline"}
                onClick={() => setBlockTarget(r)}
                className="gap-1 rounded-xl"
              >
                {!r.activo ? (
                  <>
                    <Unlock className="h-4 w-4" /> Desbloquear
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Bloquear
                  </>
                )}
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Sin resultados.
            </p>
          )}
        </Card>
      )}

      <Dialog
        open={!!blockTarget}
        onOpenChange={(o) => !o && setBlockTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!blockTarget?.activo
                ? "Desbloquear usuario"
                : "Bloquear usuario"}
            </DialogTitle>
            <DialogDescription>
              {!blockTarget?.activo
                ? `¿Estás seguro que deseás reactivar la cuenta de ${blockTarget?.nombre} ${blockTarget?.apellido}?`
                : `¿Estás seguro que deseás bloquear a ${blockTarget?.nombre} ${blockTarget?.apellido}? No podrá iniciar sesión hasta que lo desbloquees.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={doToggleBlock}
              disabled={saving}
              variant={!blockTarget?.activo ? "default" : "destructive"}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil del usuario</DialogTitle>
            <DialogDescription>
              Información registrada de la cuenta.
            </DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            viewing && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  <span className="font-medium">
                    {viewing.nombre} {viewing.apellido}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{viewing.email}</span>
                </div>
                {"perfil" in viewing && viewing.perfil?.tipo === "paciente" && (
                  <>
                    <div>
                      <span className="text-muted-foreground">
                        Fecha de nacimiento:
                      </span>{" "}
                      {viewing.perfil.fecha_nacimiento}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sexo:</span>{" "}
                      {viewing.perfil.sexo_biologico}
                    </div>
                  </>
                )}
                {"perfil" in viewing &&
                  viewing.perfil?.tipo === "nutricionista" && (
                    <>
                      <div>
                        <span className="text-muted-foreground">
                          Matrícula:
                        </span>{" "}
                        {viewing.perfil.matricula}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Estado de matrícula:
                        </span>{" "}
                        {viewing.perfil.estado_matricula ?? "—"}
                      </div>
                    </>
                  )}
                <div className="pt-2">
                  <span className="text-muted-foreground">Roles:</span>{" "}
                  {viewing.roles.map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="ml-1 text-[10px]"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
