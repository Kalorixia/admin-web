import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { recipesService, type RecetaListItem } from "@/services/recipes.service"
import { toast } from "sonner"
import { useConfirm } from "@/components/ConfirmDialog"

export default function Recipes() {
  const confirm = useConfirm()
  const [rows, setRows] = useState<RecetaListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setRows(await recipesService.list())
    setLoading(false)
  }
  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-brand-dark font-heading text-3xl font-bold">
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
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id_receta} className="flex items-center gap-3 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {r.imagen_url ? (
                  <img
                    src={r.imagen_url}
                    alt={r.nombre}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.nombre}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.categorias.slice(0, 5).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
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
                className="rounded-xl"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(r.id_receta)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Cargá la primera receta global.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
