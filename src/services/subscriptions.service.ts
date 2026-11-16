import { adminFetch } from "@/services/http"

export interface PlanSuscripcion {
  codigo: string
  nombre: string
  max_pacientes_activos: number
  max_generaciones_mes: number
  max_consultas_asistente_dia: number
}

export type LimitesPlan = Pick<
  PlanSuscripcion,
  | "max_pacientes_activos"
  | "max_generaciones_mes"
  | "max_consultas_asistente_dia"
>

export interface UsoSuscripcion {
  mes: string
  pacientes_activos: number
  generaciones_mes: number
}

export interface SuscripcionNutricionista {
  id_nutricionista: number
  nombre: string
  apellido: string
  email: string
  matricula: string
  estado_matricula: "pendiente" | "aprobada" | "rechazada"
  plan: PlanSuscripcion
  uso: UsoSuscripcion
}

export const subscriptionsService = {
  async list(): Promise<SuscripcionNutricionista[]> {
    const { nutricionistas } = await adminFetch<{
      nutricionistas: SuscripcionNutricionista[]
    }>("/administradores/suscripciones")
    return nutricionistas
  },

  async listPlans(): Promise<PlanSuscripcion[]> {
    const { planes } = await adminFetch<{ planes: PlanSuscripcion[] }>(
      "/administradores/planes-suscripcion"
    )
    return planes
  },

  /** Reemplaza los tres límites del plan (KAL-152-03). */
  async updatePlan(
    codigo: string,
    limites: LimitesPlan
  ): Promise<PlanSuscripcion> {
    return adminFetch<PlanSuscripcion>(
      `/administradores/planes-suscripcion/${encodeURIComponent(codigo)}`,
      { method: "PUT", body: limites }
    )
  },

  async changePlan(
    idNutricionista: number,
    codigoPlan: string
  ): Promise<SuscripcionNutricionista> {
    return adminFetch<SuscripcionNutricionista>(
      `/administradores/suscripciones/${idNutricionista}`,
      { method: "PUT", body: { codigo_plan: codigoPlan } }
    )
  },
}
