import { adminFetch } from "@/services/http"

export interface RecetaListItem {
  id_receta: number
  nombre: string
  descripcion: string | null
  tiempo_preparacion: number
  porciones: number
  dificultad: string | null
  calorias_por_porcion: number | null
  estado_nutricional: "pendiente" | "validada" | null
  imagen_url: string | null
  publica: boolean
  created_at: string
  updated_at: string | null
  categorias: string[]
}

export interface RecetaIngredienteDetalle {
  id_receta_ingrediente: number
  nombre: string
  cantidad: number | null
  unidad: string | null
  observaciones: string | null
}

export interface PasoDetalle {
  id_paso: number
  numero_paso: number
  descripcion: string
  tiempo_minutos: number | null
  imagen_url: string | null
}

export interface NutricionReceta {
  energia_kcal: number | null
  proteinas_g: number | null
  carbohidratos_g: number | null
  grasas_totales_g: number | null
  grasas_saturadas_g: number | null
  fibra_g: number | null
  azucares_g: number | null
  sodio_mg: number | null
  alcohol_g: number | null
  grasas_monoinsaturadas_g: number | null
  grasas_poliinsaturadas_g: number | null
  omega_3_g: number | null
  omega_6_g: number | null
  vitamina_d_ug: number | null
  vitamina_b12_ug: number | null
  magnesio_mg: number | null
  zinc_mg: number | null
  estado: "pendiente" | "validada"
  fuente: string | null
  id_usuario_validador: number | null
  fecha_carga: string
  fecha_validacion: string | null
}

export interface NutricionRecetaInput {
  energia_kcal?: number | null
  proteinas_g?: number | null
  carbohidratos_g?: number | null
  grasas_totales_g?: number | null
  grasas_saturadas_g?: number | null
  fibra_g?: number | null
  azucares_g?: number | null
  sodio_mg?: number | null
  alcohol_g?: number | null
  grasas_monoinsaturadas_g?: number | null
  grasas_poliinsaturadas_g?: number | null
  omega_3_g?: number | null
  omega_6_g?: number | null
  vitamina_d_ug?: number | null
  vitamina_b12_ug?: number | null
  magnesio_mg?: number | null
  zinc_mg?: number | null
  fuente?: string | null
  validada: boolean
}

export interface RecetaDetalle extends RecetaListItem {
  id_usuario: number
  imagenes: string[]
  ingredientes: RecetaIngredienteDetalle[]
  pasos: PasoDetalle[]
  nutricion: NutricionReceta | null
}

export interface IngredienteInput {
  nombre: string
  cantidad?: number | null
  unidad?: string | null
  observaciones?: string | null
}

export interface PasoInput {
  descripcion: string
  tiempo_minutos?: number | null
  imagen_url?: string | null
}

export interface RecetaInput {
  nombre: string
  descripcion?: string | null
  tiempo_preparacion: number
  porciones: number
  dificultad?: string | null
  imagenes: string[]
  publica: boolean
  ingredientes: IngredienteInput[]
  pasos: PasoInput[]
  categorias: string[]
  nutricion: NutricionRecetaInput | null
}

export interface Categoria {
  id_categoria: number
  nombre: string
  descripcion: string | null
  icono: string | null
}

export interface Ingrediente {
  id_ingrediente: number
  nombre: string
  unidad_medida: string | null
}

export interface ListaRecetasResponse {
  recetas: RecetaListItem[]
  total: number
  limit: number | null
  offset: number
}
interface ListaCategoriasResponse {
  categorias: Categoria[]
}
interface ListaIngredientesResponse {
  ingredientes: Ingrediente[]
}

export const recipesService = {
  /**
   * Sin `limit`, devuelve el catálogo completo sin paginar (lo usa el
   * dashboard para las estadísticas). El listado navegable de recetas debe
   * pasar `limit`/`offset`.
   */
  async list(
    params: { q?: string; limit?: number; offset?: number } = {}
  ): Promise<ListaRecetasResponse> {
    const search = new URLSearchParams()
    if (params.q) search.set("q", params.q)
    if (params.limit) search.set("limit", String(params.limit))
    if (params.offset) search.set("offset", String(params.offset))
    const qs = search.toString() ? `?${search.toString()}` : ""
    return adminFetch<ListaRecetasResponse>(`/recetas${qs}`)
  },

  async get(id: number): Promise<RecetaDetalle> {
    return adminFetch<RecetaDetalle>(`/recetas/${id}`)
  },

  async create(input: RecetaInput): Promise<RecetaDetalle> {
    return adminFetch<RecetaDetalle>("/recetas", {
      method: "POST",
      body: input,
    })
  },

  async update(id: number, input: RecetaInput): Promise<RecetaDetalle> {
    return adminFetch<RecetaDetalle>(`/recetas/${id}`, {
      method: "PUT",
      body: input,
    })
  },

  async remove(id: number): Promise<void> {
    await adminFetch(`/recetas/${id}`, { method: "DELETE" })
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    const { url } = await adminFetch<{ url: string }>("/recetas/imagenes", {
      method: "POST",
      body: formData,
    })
    return url
  },

  async listCategorias(): Promise<Categoria[]> {
    const { categorias } = await adminFetch<ListaCategoriasResponse>(
      "/recetas/categorias"
    )
    return categorias
  },

  async listIngredientes(q?: string): Promise<Ingrediente[]> {
    const qs = q ? `?q=${encodeURIComponent(q)}` : ""
    const { ingredientes } = await adminFetch<ListaIngredientesResponse>(
      `/recetas/ingredientes${qs}`
    )
    return ingredientes
  },
}
