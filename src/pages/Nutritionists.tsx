import { useEffect, useMemo, useState } from "react"
import {
  Check,
  X,
  Loader2,
  Stethoscope,
  Search,
  Eye,
  Lightbulb,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  nutritionistsService,
  type NutritionistApplication,
} from "@/services/nutritionists.service"
import { toast } from "sonner"

type Tab = "pendiente" | "aprobada" | "rechazada"

export default function Nutritionists() {
  const [rows, setRows] = useState<NutritionistApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("pendiente")
  const [query, setQuery] = useState("")
  const [approving, setApproving] = useState<NutritionistApplication | null>(
    null
  )
  const [rejecting, setRejecting] = useState<NutritionistApplication | null>(
    null
  )
  const [organismo, setOrganismo] = useState("")
  const [numeroExpediente, setNumeroExpediente] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [viewing, setViewing] = useState<NutritionistApplication | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setRows(await nutritionistsService.list())
    setLoading(false)
  }
  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  const counts = useMemo(
    () => ({
      pendiente: rows.filter((r) => r.estado === "pendiente").length,
      aprobada: rows.filter((r) => r.estado === "aprobada").length,
      rechazada: rows.filter((r) => r.estado === "rechazada").length,
    }),
    [rows]
  )

  const filtered = rows.filter(
    (r) =>
      r.estado === tab &&
      (!query.trim() ||
        `${r.nombre} ${r.apellido}`
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        r.matricula.toLowerCase().includes(query.toLowerCase()))
  )

  const openApprove = (row: NutritionistApplication) => {
    setApproving(row)
    setOrganismo("")
    setNumeroExpediente("")
    setObservaciones("")
  }

  const openReject = (row: NutritionistApplication) => {
    setRejecting(row)
    setOrganismo("")
    setNumeroExpediente("")
    setObservaciones("")
  }

  const doApprove = async () => {
    if (!approving) return
    if (!organismo.trim()) {
      toast.error("Ingresá el organismo que valida la matrícula")
      return
    }
    setSaving(true)
    try {
      await nutritionistsService.resolve(approving.id_validacion, {
        estado: "aprobada",
        organismo: organismo.trim(),
        numero_expediente: numeroExpediente.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      })
      toast.success(`${approving.nombre} ${approving.apellido} fue aprobado/a`)
      setApproving(null)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const doReject = async () => {
    if (!rejecting) return
    if (!organismo.trim()) {
      toast.error("Ingresá el organismo que valida la matrícula")
      return
    }
    if (!observaciones.trim()) {
      toast.error("Ingresá un motivo de rechazo")
      return
    }
    setSaving(true)
    try {
      await nutritionistsService.resolve(rejecting.id_validacion, {
        estado: "rechazada",
        organismo: organismo.trim(),
        numero_expediente: numeroExpediente.trim() || undefined,
        observaciones: observaciones.trim(),
      })
      toast.success("Solicitud rechazada")
      setRejecting(null)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-brand-dark font-heading text-3xl font-bold">
          Nutricionistas
        </h1>
        <span className="text-muted-foreground">
          — Aprobá o rechazá solicitudes profesionales
        </span>
      </div>

      <div className="flex gap-6 border-b border-border">
        {[
          {
            key: "pendiente" as Tab,
            label: `Pendientes de Aprobación${counts.pendiente ? ` (${counts.pendiente})` : ""}`,
          },
          {
            key: "aprobada" as Tab,
            label: `Aprobados${counts.aprobada ? ` (${counts.aprobada})` : ""}`,
          },
          {
            key: "rechazada" as Tab,
            label: `Rechazados${counts.rechazada ? ` (${counts.rechazada})` : ""}`,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-md min-w-[240px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o matrícula…"
            className="rounded-xl pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Card className="divide-y divide-border">
          {filtered.map((r) => (
            <div key={r.id_validacion} className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-secondary p-2">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.nombre} {r.apellido}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  MN {r.matricula} ·{" "}
                  {r.especialidades.length > 0
                    ? r.especialidades.join(", ")
                    : "Nutrición"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewing(r)}
                className="gap-1 rounded-xl"
              >
                <Eye className="h-4 w-4" /> Ver Perfil
              </Button>
              {r.estado !== "aprobada" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openApprove(r)}
                  className="gap-1 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  <Check className="h-4 w-4" /> Aceptar
                </Button>
              )}
              {r.estado !== "rechazada" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openReject(r)}
                  className="gap-1 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" /> Rechazar
                </Button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Sin resultados en esta pestaña.
            </p>
          )}
        </Card>
      )}

      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <Lightbulb className="h-3 w-3" /> Mostrando {filtered.length} de{" "}
        {filtered.length} solicitudes
      </p>

      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Aprobación</DialogTitle>
            <DialogDescription>
              Estás a punto de aceptar a {approving?.nombre}{" "}
              {approving?.apellido}. Completá los datos de la validación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Organismo</Label>
              <Input
                value={organismo}
                onChange={(e) => setOrganismo(e.target.value)}
                placeholder="Ej: Colegio de Nutricionistas de la Prov. de Bs. As."
              />
            </div>
            <div>
              <Label>N° de expediente (opcional)</Label>
              <Input
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
              />
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              Cancelar
            </Button>
            <Button
              onClick={doApprove}
              disabled={saving}
              className="bg-brand-green hover:bg-brand-green/90 text-white"
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

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Vas a rechazar la solicitud de {rejecting?.nombre}{" "}
              {rejecting?.apellido}. Completá los datos para dejar registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Organismo</Label>
              <Input
                value={organismo}
                onChange={(e) => setOrganismo(e.target.value)}
                placeholder="Ej: Colegio de Nutricionistas de la Prov. de Bs. As."
              />
            </div>
            <div>
              <Label>N° de expediente (opcional)</Label>
              <Input
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
              />
            </div>
            <div>
              <Label>Motivo del rechazo</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: documentación insuficiente, matrícula no verificable, etc."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button
              onClick={doReject}
              disabled={saving || !observaciones.trim() || !organismo.trim()}
              variant="destructive"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Rechazar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil profesional</DialogTitle>
            <DialogDescription>Datos de la solicitud</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>{" "}
                <span className="font-medium">
                  {viewing.nombre} {viewing.apellido}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Matrícula:</span> MN{" "}
                {viewing.matricula}
              </div>
              <div>
                <span className="text-muted-foreground">Especialidades:</span>{" "}
                {viewing.especialidades.length > 0
                  ? viewing.especialidades.join(", ")
                  : "Nutrición"}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                {viewing.email}
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>{" "}
                {viewing.estado}
              </div>
              {viewing.organismo && (
                <div>
                  <span className="text-muted-foreground">Organismo:</span>{" "}
                  {viewing.organismo}
                </div>
              )}
              {viewing.observaciones && (
                <div>
                  <span className="text-muted-foreground">Observaciones:</span>{" "}
                  {viewing.observaciones}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
