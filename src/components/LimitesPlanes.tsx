import { useState } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  subscriptionsService,
  type LimitesPlan,
  type PlanSuscripcion,
} from "@/services/subscriptions.service"

const CAMPOS: {
  clave: keyof LimitesPlan
  label: string
  ayuda: string
  max: number
}[] = [
  {
    clave: "max_pacientes_activos",
    label: "Pacientes activos",
    ayuda: "Vinculados a la vez",
    max: 100_000,
  },
  {
    clave: "max_generaciones_mes",
    label: "Borradores del Copiloto",
    ayuda: "Por mes calendario",
    max: 100_000,
  },
  {
    clave: "max_consultas_asistente_dia",
    label: "Consultas al asistente",
    ayuda: "Por paciente, por día",
    max: 10_000,
  },
]

type Borrador = Record<keyof LimitesPlan, string>

function borradorDe(plan: PlanSuscripcion): Borrador {
  return {
    max_pacientes_activos: String(plan.max_pacientes_activos),
    max_generaciones_mes: String(plan.max_generaciones_mes),
    max_consultas_asistente_dia: String(plan.max_consultas_asistente_dia),
  }
}

/** Entero entre 1 y `max`, o `null` si no lo es. */
function valorValido(texto: string, max: number): number | null {
  if (!/^\d+$/.test(texto.trim())) return null
  const n = Number(texto)
  return n >= 1 && n <= max ? n : null
}

function TarjetaPlan({
  plan,
  onGuardado,
}: {
  plan: PlanSuscripcion
  onGuardado: (plan: PlanSuscripcion) => void
}) {
  const [borrador, setBorrador] = useState<Borrador>(() => borradorDe(plan))
  const [guardando, setGuardando] = useState(false)

  const valores = CAMPOS.map((c) => valorValido(borrador[c.clave], c.max))
  const valido = valores.every((v) => v !== null)
  const cambiado = CAMPOS.some(
    (c) => borrador[c.clave] !== String(plan[c.clave])
  )

  const guardar = async () => {
    if (!valido || !cambiado) return
    const limites = Object.fromEntries(
      CAMPOS.map((c, i) => [c.clave, valores[i]])
    ) as LimitesPlan
    setGuardando(true)
    try {
      const actualizado = await subscriptionsService.updatePlan(
        plan.codigo,
        limites
      )
      onGuardado(actualizado)
      toast.success(
        `Se actualizaron los límites del plan ${actualizado.nombre}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los límites"
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <p className="font-heading text-lg font-semibold text-foreground">
        {plan.nombre}
      </p>
      <div className="space-y-3">
        {CAMPOS.map((c, i) => {
          const id = `${plan.codigo}-${c.clave}`
          const invalido = valores[i] === null
          return (
            <div key={c.clave} className="space-y-1">
              <Label htmlFor={id}>{c.label}</Label>
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={c.max}
                step={1}
                value={borrador[c.clave]}
                onChange={(e) =>
                  setBorrador((prev) => ({
                    ...prev,
                    [c.clave]: e.target.value,
                  }))
                }
                aria-invalid={invalido}
                className="rounded-xl"
              />
              <p
                className={
                  invalido
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {invalido
                  ? `Tiene que ser un número entero entre 1 y ${c.max.toLocaleString("es-AR")}`
                  : c.ayuda}
              </p>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={guardar}
          disabled={!valido || !cambiado || guardando}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        {cambiado && !guardando ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBorrador(borradorDe(plan))}
          >
            Descartar
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

/**
 * Límites editables de cada plan (KAL-152-03). Los planes en sí entran por
 * migración: acá solo se cambian sus números, que aplican en el acto a todos
 * los nutricionistas del plan.
 */
export function LimitesPlanes({
  plans,
  onPlanActualizado,
}: {
  plans: PlanSuscripcion[]
  onPlanActualizado: (plan: PlanSuscripcion) => void
}) {
  if (plans.length === 0) return null
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Límites de los planes
        </h2>
        <p className="text-sm text-muted-foreground">
          Aplican a todos los nutricionistas de cada plan. Bajar un límite no
          quita nada de lo existente: solo frena lo nuevo.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          // La key incluye los límites: al guardar, la tarjeta se vuelve a
          // montar con el plan nuevo y el borrador arranca de ahí.
          <TarjetaPlan
            key={`${plan.codigo}-${plan.max_pacientes_activos}-${plan.max_generaciones_mes}-${plan.max_consultas_asistente_dia}`}
            plan={plan}
            onGuardado={onPlanActualizado}
          />
        ))}
      </div>
    </section>
  )
}
