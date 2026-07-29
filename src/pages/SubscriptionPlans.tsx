import { useEffect, useState } from "react"
import { Crown, Plus, Pencil, Power } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  subscriptionPlansService,
  type SubscriptionPlan,
  type SubscriptionPlanInput,
} from "@/services/subscriptionPlans.service"
import { toast } from "sonner"
import { useConfirm } from "@/components/ConfirmDialog"
import KalorixiaLoader from "@/components/KalorixiaLoader"

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  )

const emptyForm: SubscriptionPlanInput = {
  name: "",
  description: "",
  price_monthly: 0,
  max_patients: 0,
  ai_limit: 0,
  features: [],
  active: true,
}

export default function SubscriptionPlans() {
  const confirm = useConfirm()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SubscriptionPlanInput>(emptyForm)
  const [featuresText, setFeaturesText] = useState("")

  const load = async () => {
    setPlans(await subscriptionPlansService.list())
    setLoading(false)
  }
  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setFeaturesText("")
    setOpen(true)
  }
  const openEdit = (p: SubscriptionPlan) => {
    setEditing(p)
    setForm({ ...p })
    setFeaturesText((p.features ?? []).join("\n"))
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    const features = featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
    const payload: SubscriptionPlanInput = { ...form, features }
    try {
      if (editing) {
        await subscriptionPlansService.update(editing.id, payload)
        toast.success("Plan actualizado")
      } else {
        await subscriptionPlansService.create(payload)
        toast.success("Plan creado")
      }
      setOpen(false)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  const toggleActive = async (p: SubscriptionPlan) => {
    const goingInactive = p.active
    const ok = await confirm({
      title: goingInactive
        ? `¿Desactivar "${p.name}"?`
        : `¿Reactivar "${p.name}"?`,
      description: goingInactive
        ? "Los nutricionistas con este plan lo conservarán, pero dejará de ofrecerse a nuevos usuarios."
        : "El plan volverá a estar disponible para contratación.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      confirmClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
      cancelClassName:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0",
    })
    if (!ok) return
    try {
      await subscriptionPlansService.toggleActive(p.id)
      toast.success("Estado actualizado")
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-foreground">
            <Crown className="h-7 w-7 text-primary" /> Planes de Suscripción
          </h1>
          <p className="text-sm text-muted-foreground">
            Administrá los planes disponibles del sistema.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-full">
          <Plus className="h-4 w-4" /> Crear nuevo plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <KalorixiaLoader />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30 text-left">
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Precio mensual</th>
                  <th className="px-4 py-3 font-semibold">Pacientes máx.</th>
                  <th className="px-4 py-3 font-semibold">IA</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-secondary/20"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      {p.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmtUSD(p.price_monthly)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.max_patients}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.ai_limit} / mes
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          p.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => toggleActive(p)}
                        >
                          <Power className="mr-1 h-3.5 w-3.5" />{" "}
                          {p.active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Sin planes cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plan" : "Nuevo plan"}</DialogTitle>
            <DialogDescription>
              Definí los límites y funcionalidades del plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Nombre del plan</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Precio (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price_monthly}
                  onChange={(e) =>
                    setForm({ ...form, price_monthly: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Pacientes máx.</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_patients}
                  onChange={(e) =>
                    setForm({ ...form, max_patients: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Límite IA</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.ai_limit}
                  onChange={(e) =>
                    setForm({ ...form, ai_limit: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Funcionalidades (una por línea)</Label>
              <Textarea
                rows={4}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={
                  "Hasta X pacientes activos\nConsumo limitado de IA\n..."
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Plan activo</p>
                <p className="text-xs text-muted-foreground">
                  Los planes inactivos no se ofrecen a nuevos usuarios.
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>
              {editing ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
