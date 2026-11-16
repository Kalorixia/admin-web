import { useEffect, useState } from "react"
import { Crown, Search } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  subscriptionsService,
  type PlanSuscripcion,
  type SuscripcionNutricionista,
} from "@/services/subscriptions.service"
import KalorixiaLoader from "@/components/KalorixiaLoader"
import { LimitesPlanes } from "@/components/LimitesPlanes"

const badgeCls: Record<string, string> = {
  aprobada:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  pendiente:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rechazada: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
}

function formatMes(mes: string): string {
  const [anio, m] = mes.split("-").map(Number)
  if (!anio || !m) return mes
  return new Date(anio, m - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })
}

function Uso({ actual, max }: { actual: number; max: number }) {
  const alLimite = actual >= max
  return (
    <span className="text-muted-foreground">
      <span className={alLimite ? "font-semibold text-destructive" : ""}>
        {actual}
      </span>{" "}
      de {max}
    </span>
  )
}

export default function Subscriptions() {
  const [rows, setRows] = useState<SuscripcionNutricionista[]>([])
  const [plans, setPlans] = useState<PlanSuscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("todos")
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [list, planes] = await Promise.all([
          subscriptionsService.list(),
          subscriptionsService.listPlans(),
        ])
        setRows(list)
        setPlans(planes)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las suscripciones"
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleChangePlan = async (
    row: SuscripcionNutricionista,
    codigoPlan: string
  ) => {
    if (codigoPlan === row.plan.codigo) return
    setSavingId(row.id_nutricionista)
    try {
      const updated = await subscriptionsService.changePlan(
        row.id_nutricionista,
        codigoPlan
      )
      setRows((prev) =>
        prev.map((r) =>
          r.id_nutricionista === updated.id_nutricionista ? updated : r
        )
      )
      toast.success(
        `${updated.nombre} ${updated.apellido} pasó al plan ${updated.plan.nombre}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cambiar el plan"
      )
    } finally {
      setSavingId(null)
    }
  }

  // Los nutricionistas del plan editado ven los límites nuevos sin recargar.
  const handlePlanActualizado = (plan: PlanSuscripcion) => {
    setPlans((prev) => prev.map((p) => (p.codigo === plan.codigo ? plan : p)))
    setRows((prev) =>
      prev.map((r) => (r.plan.codigo === plan.codigo ? { ...r, plan } : r))
    )
  }

  const filtered = rows.filter((r) => {
    if (filter !== "todos" && r.plan.codigo !== filter) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      r.email.toLowerCase().includes(q) ||
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(q)
    )
  })

  const mes = rows[0]?.uso.mes

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-foreground">
          <Crown className="h-7 w-7 text-primary" /> Suscripciones de
          Nutricionistas
        </h1>
        <p className="text-sm text-muted-foreground">
          Plan asignado y uso del mes de cada profesional.
          {mes ? ` Mes: ${formatMes(mes)}` : ""}
        </p>
      </div>

      {!loading && (
        <LimitesPlanes
          plans={plans}
          onPlanActualizado={handlePlanActualizado}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md min-w-[240px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por email o nombre…"
            className="rounded-xl pl-9"
          />
        </div>
        {[{ codigo: "todos", nombre: "Todos" }, ...plans].map((p) => (
          <Button
            key={p.codigo}
            size="sm"
            variant={filter === p.codigo ? "default" : "outline"}
            onClick={() => setFilter(p.codigo)}
            className="rounded-full"
          >
            {p.nombre}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <KalorixiaLoader />
        </div>
      ) : (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Sin suscripciones para mostrar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30 text-left">
                    <th className="px-4 py-3 font-semibold">Nutricionista</th>
                    <th className="px-4 py-3 font-semibold">Matrícula</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">
                      Pacientes activos
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Borradores del Copiloto del mes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id_nutricionista}
                      className="border-b last:border-0 hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {r.nombre} {r.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${badgeCls[r.estado_matricula] ?? ""} font-semibold`}
                          variant="secondary"
                        >
                          {r.estado_matricula}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.plan.codigo}
                          disabled={savingId === r.id_nutricionista}
                          onChange={(e) => handleChangePlan(r, e.target.value)}
                          aria-label={`Plan de ${r.nombre} ${r.apellido}`}
                          className="h-9 rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {plans.map((p) => (
                            <option key={p.codigo} value={p.codigo}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Uso
                          actual={r.uso.pacientes_activos}
                          max={r.plan.max_pacientes_activos}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Uso
                          actual={r.uso.generaciones_mes}
                          max={r.plan.max_generaciones_mes}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
