import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Loader2, Pencil, Search, Trash2, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Pagination from "@/components/Pagination"
import { recipesService, type RecetaListItem } from "@/services/recipes.service"
import { toast } from "sonner"
import { useConfirm } from "@/components/ConfirmDialog"

const LIMIT = 20
const DEBOUNCE_MS = 350

export default function Recipes() {
  const confirm = useConfirm()
  const [rows, setRows] = useState<RecetaListItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => {
      // Cada búsqueda nueva arranca desde la primera página.
      setDebouncedQuery(query)
      setOffset(0)
    }, DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query])

  const load = async () => {
    setLoading(true)
    try {
      const result = await recipesService.list({
        q: debouncedQuery || undefined,
        limit: LIMIT,
        offset,
      })
      setRows(result.recetas)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, offset])

  const remove = async (id: number) => {
    const ok = await confirm({
      title: "¿Estás seguro que deseas eliminar esta receta?",
      description: "Esta acción no se puede deshacer.",
    })
    if (!ok) return
    try {
      await recipesService.remove(id)
      toast.success("Eliminada")
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="hero-gradient flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/15 p-6 shadow-sm sm:p-8">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Catálogo
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Recetas globales
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo disponible para todos los usuarios
          </p>
        </div>
        <Button
          render={<Link to="/recetas/nueva" />}
          className="bg-brand-green hover:bg-brand-green/90 rounded-xl text-white"
        >
          <Plus className="mr-1 h-4 w-4" /> Nueva receta
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o categoría…"
          className="surface-raised h-11 rounded-xl border-border/80 pl-9"
        />
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <Card className="divide-y divide-border/70 overflow-hidden border-border/70 p-0 shadow-sm">
            {rows.map((r) => (
              <div
                key={r.id_receta}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40 sm:gap-4"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {r.imagen_url ? (
                    <img
                      src={r.imagen_url}
                      alt={r.nombre}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="surface-subtle flex h-full w-full items-center justify-center text-muted-foreground">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.nombre}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.categorias.slice(0, 5).map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {t}
                      </Badge>
                    ))}
                    {!r.publica && (
                      <Badge variant="outline" className="text-[10px]">
                        No pública
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  render={<Link to={`/recetas/${r.id_receta}`} />}
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-primary/25 text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-destructive/20 hover:bg-destructive/10"
                  onClick={() => remove(r.id_receta)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {debouncedQuery
                  ? "No encontramos recetas para esa búsqueda."
                  : "Cargá la primera receta global."}
              </p>
            )}
          </Card>

          <Pagination
            total={total}
            limit={LIMIT}
            offset={offset}
            onOffsetChange={setOffset}
          />
        </>
      )}
    </div>
  )
}
