import { adminFetch } from "@/services/http"

export interface NutritionistApplication {
  id_validacion: number
  id_nutricionista: number
  matricula: string
  nombre: string
  apellido: string
  email: string
  estado: "pendiente" | "aprobada" | "rechazada"
  fecha_solicitud: string
  fecha_validacion: string | null
  organismo: string | null
  numero_expediente: string | null
  observaciones: string | null
  especialidades: string[]
}

interface ListaValidacionesResponse {
  validaciones: NutritionistApplication[]
}

export interface ResolverValidacionInput {
  estado: "aprobada" | "rechazada"
  organismo: string
  numero_expediente?: string
  observaciones?: string
}

export const nutritionistsService = {
  async list(): Promise<NutritionistApplication[]> {
    const { validaciones } = await adminFetch<ListaValidacionesResponse>(
      "/administradores/matriculas"
    )
    return validaciones
  },

  async resolve(
    idValidacion: number,
    input: ResolverValidacionInput
  ): Promise<void> {
    await adminFetch(`/administradores/matriculas/${idValidacion}`, {
      method: "PATCH",
      body: input,
    })
  },
}
