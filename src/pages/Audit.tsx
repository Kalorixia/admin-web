import { useEffect, useState } from "react"
import { ScrollText, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { auditService, type AuditRow } from "@/services/audit.service"
import KalorixiaLoader from "@/components/KalorixiaLoader"

const entityTypes = [
  "todos",
  "user",
  "nutritionist",
  "subscription",
  "recipe",
  "plan",
  "role",
]

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("todos")

  useEffect(() => {
    ;(async () => {
      setRows(await auditService.list(500))
      setLoading(false)
    })()
  }, [])

  const filtered = rows.filter((r) => {
    if (filter !== "todos" && r.entity_type !== filter) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      r.action.toLowerCase().includes(q) ||
      (r.actor_name ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-foreground">
          <ScrollText className="h-7 w-7 text-primary" /> Auditoría
        </h1>
        <p className="text-sm text-muted-foreground">
          Registro solo-lectura de las acciones críticas del sistema
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-md min-w-[240px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción o usuario…"
            className="rounded-xl pl-9"
          />
        </div>
        {entityTypes.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filter === t ? "default" : "outline"}
            onClick={() => setFilter(t)}
            className="rounded-full capitalize"
          >
            {t}
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
              No hay registros de auditoría.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {r.actor_name || "Sistema"}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.entity_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {r.action}
                        </span>
                      </div>
                      {r.entity_id && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          ID: {r.entity_id}
                        </p>
                      )}
                      {r.metadata && Object.keys(r.metadata).length > 0 && (
                        <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
                          {JSON.stringify(r.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("es-AR")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
