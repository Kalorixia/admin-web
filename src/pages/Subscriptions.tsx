import { useEffect, useState } from "react"
import { Crown, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  subscriptionsService,
  type SubscriptionRow,
} from "@/services/subscriptions.service"
import KalorixiaLoader from "@/components/KalorixiaLoader"

type Status = "todos" | "activa" | "cancelada" | "vencida"

const badgeCls: Record<string, string> = {
  activa:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  cancelada: "bg-muted text-muted-foreground",
  vencida: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
}

const payCls: Record<string, string> = {
  pagado: "bg-emerald-100 text-emerald-700",
  pendiente: "bg-amber-100 text-amber-700",
  vencido: "bg-rose-100 text-rose-700",
}

export default function Subscriptions() {
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Status>("todos")

  useEffect(() => {
    ;(async () => {
      setRows(await subscriptionsService.list())
      setLoading(false)
    })()
  }, [])

  const filtered = rows.filter((r) => {
    if (filter !== "todos" && r.status !== filter) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      (r.profile.email ?? "").toLowerCase().includes(q) ||
      (r.profile.full_name ?? "").toLowerCase().includes(q)
    )
  })

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-AR") : "—"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-foreground">
          <Crown className="h-7 w-7 text-primary" /> Suscripciones de
          Nutricionistas
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultá las suscripciones contratadas por los profesionales.
        </p>
      </div>

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
        {(["todos", "activa", "cancelada", "vencida"] as Status[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className="rounded-full capitalize"
          >
            {s}
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
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Renovación</th>
                    <th className="px-4 py-3 font-semibold">
                      Pacientes activos
                    </th>
                    <th className="px-4 py-3 font-semibold">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-secondary/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {r.profile.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.profile.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.plan_name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${badgeCls[r.status] ?? ""} font-semibold`}
                          variant="secondary"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmt(r.started_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmt(r.next_charge_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.patients_active}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${payCls[r.payment_status ?? ""] ?? "bg-muted text-muted-foreground"} font-semibold`}
                          variant="secondary"
                        >
                          {r.payment_status || "—"}
                        </Badge>
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
