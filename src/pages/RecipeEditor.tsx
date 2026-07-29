import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Clock, Save, Trash2, Plus, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  recipesService,
  type Categoria,
  type Ingrediente,
  type NutricionRecetaInput,
  type RecetaInput,
} from "@/services/recipes.service"
import { toast } from "sonner"
import { useConfirm } from "@/components/ConfirmDialog"

const UNIDADES = ["g", "ml", "u"] as const

interface IngredienteForm {
  nombre: string
  cantidad: number | ""
  unidad: string
  observaciones: string
}

const ingredienteVacio = (): IngredienteForm => ({
  nombre: "",
  cantidad: "",
  unidad: "g",
  observaciones: "",
})

type CampoNutricion =
  | "energia_kcal"
  | "proteinas_g"
  | "carbohidratos_g"
  | "grasas_totales_g"
  | "grasas_saturadas_g"
  | "fibra_g"
  | "azucares_g"
  | "sodio_mg"
  | "alcohol_g"
  | "grasas_monoinsaturadas_g"
  | "grasas_poliinsaturadas_g"
  | "omega_3_g"
  | "omega_6_g"
  | "vitamina_d_ug"
  | "vitamina_b12_ug"
  | "magnesio_mg"
  | "zinc_mg"

type NutricionForm = Record<CampoNutricion, number | "">

const CAMPOS_BASICOS: {
  key: CampoNutricion
  label: string
  unidad: string
}[] = [
  { key: "energia_kcal", label: "Energía", unidad: "kcal" },
  { key: "proteinas_g", label: "Proteínas", unidad: "g" },
  { key: "carbohidratos_g", label: "Carbohidratos", unidad: "g" },
  { key: "grasas_totales_g", label: "Grasas totales", unidad: "g" },
]

const CAMPOS_OPCIONALES: {
  key: CampoNutricion
  label: string
  unidad: string
}[] = [
  { key: "grasas_saturadas_g", label: "Grasas saturadas", unidad: "g" },
  { key: "fibra_g", label: "Fibra", unidad: "g" },
  { key: "azucares_g", label: "Azúcares", unidad: "g" },
  { key: "sodio_mg", label: "Sodio", unidad: "mg" },
  { key: "alcohol_g", label: "Alcohol", unidad: "g" },
  {
    key: "grasas_monoinsaturadas_g",
    label: "Grasas monoinsaturadas",
    unidad: "g",
  },
  {
    key: "grasas_poliinsaturadas_g",
    label: "Grasas poliinsaturadas",
    unidad: "g",
  },
  { key: "omega_3_g", label: "Omega-3", unidad: "g" },
  { key: "omega_6_g", label: "Omega-6", unidad: "g" },
  { key: "vitamina_d_ug", label: "Vitamina D", unidad: "µg" },
  { key: "vitamina_b12_ug", label: "Vitamina B12", unidad: "µg" },
  { key: "magnesio_mg", label: "Magnesio", unidad: "mg" },
  { key: "zinc_mg", label: "Zinc", unidad: "mg" },
]

const nutricionVacia = (): NutricionForm =>
  Object.fromEntries(
    [...CAMPOS_BASICOS, ...CAMPOS_OPCIONALES].map(({ key }) => [key, ""])
  ) as NutricionForm
interface PasoForm {
  descripcion: string
  tiempoMinutos: number | ""
  mostrarTiempo: boolean
}

export default function RecipeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const isNew = !id || id === "nueva"

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [imagenes, setImagenes] = useState<string[]>([])
  const [imagenActiva, setImagenActiva] = useState(0)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [tiempoPreparacion, setTiempoPreparacion] = useState<number | "">("")
  const [porciones, setPorciones] = useState<number | "">(1)
  const [dificultad, setDificultad] = useState("Fácil")
  const [nutricion, setNutricion] = useState<NutricionForm>(nutricionVacia)
  const [nutrientesOpcionales, setNutrientesOpcionales] = useState<
    CampoNutricion[]
  >([])
  const [nutrienteParaAgregar, setNutrienteParaAgregar] = useState("")
  const [fuenteNutricional, setFuenteNutricional] = useState("")
  const [nutricionValidada, setNutricionValidada] = useState(false)
  const [publica, setPublica] = useState(true)
  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([
    ingredienteVacio(),
  ])
  const [pasos, setPasos] = useState<PasoForm[]>([
    { descripcion: "", tiempoMinutos: "", mostrarTiempo: false },
  ])
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    string[]
  >([])
  const [nuevaCategoria, setNuevaCategoria] = useState("")
  const [catalogoIngredientes, setCatalogoIngredientes] = useState<
    Ingrediente[]
  >([])

  useEffect(() => {
    void (async () => {
      const [categorias, ingredientesCatalogo] = await Promise.all([
        recipesService.listCategorias(),
        recipesService.listIngredientes(),
      ])
      setCategoriasDisponibles(categorias)
      setCatalogoIngredientes(ingredientesCatalogo)

      if (!isNew) {
        const data = await recipesService.get(Number(id))
        setNombre(data.nombre)
        setDescripcion(data.descripcion ?? "")
        setImagenes(data.imagenes)
        setImagenActiva(0)
        setTiempoPreparacion(data.tiempo_preparacion)
        setPorciones(data.porciones)
        setDificultad(data.dificultad ?? "Fácil")
        if (data.nutricion) {
          setNutricion(
            Object.fromEntries(
              [...CAMPOS_BASICOS, ...CAMPOS_OPCIONALES].map(({ key }) => [
                key,
                data.nutricion?.[key] ?? "",
              ])
            ) as NutricionForm
          )
          setNutrientesOpcionales(
            CAMPOS_OPCIONALES.filter(
              ({ key }) => data.nutricion?.[key] != null
            ).map(({ key }) => key)
          )
          setFuenteNutricional(data.nutricion.fuente ?? "")
          setNutricionValidada(data.nutricion.estado === "validada")
        }
        setPublica(data.publica)
        setIngredientes(
          data.ingredientes.length > 0
            ? data.ingredientes.map((i) => ({
                ...ingredienteVacio(),
                nombre: i.nombre,
                cantidad: i.cantidad ?? "",
                unidad: i.unidad ?? "g",
                observaciones: i.observaciones ?? "",
              }))
            : [ingredienteVacio()]
        )
        setPasos(
          data.pasos.length > 0
            ? data.pasos.map((p) => ({
                descripcion: p.descripcion,
                tiempoMinutos: p.tiempo_minutos ?? "",
                mostrarTiempo: p.tiempo_minutos != null,
              }))
            : [{ descripcion: "", tiempoMinutos: "", mostrarTiempo: false }]
        )
        setCategoriasSeleccionadas(data.categorias)
      }
      setLoading(false)
    })()
  }, [id, isNew])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (imagenes.length + files.length > 5) {
      toast.error(`Podés cargar hasta 5 imágenes. Te quedan ${5 - imagenes.length}.`)
      e.target.value = ""
      return
    }
    setUploadingImage(true)
    try {
      const urls = await Promise.all(files.map((file) => recipesService.uploadImage(file)))
      setImagenes((prev) => [...prev, ...urls])
      if (imagenes.length === 0) setImagenActiva(0)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir la imagen"
      )
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const toggleCategoria = (nombreCategoria: string) =>
    setCategoriasSeleccionadas((prev) =>
      prev.includes(nombreCategoria)
        ? prev.filter((x) => x !== nombreCategoria)
        : [...prev, nombreCategoria]
    )

  const agregarNuevaCategoria = () => {
    const value = nuevaCategoria.trim()
    if (!value) return
    if (!categoriasSeleccionadas.includes(value)) {
      setCategoriasSeleccionadas((prev) => [...prev, value])
    }
    setNuevaCategoria("")
  }

  const save = async () => {
    if (!nombre.trim()) {
      toast.error("Falta el nombre")
      return
    }
    const basicosCompletos = CAMPOS_BASICOS.every(
      ({ key }) => nutricion[key] !== ""
    )
    if (publica && !basicosCompletos) {
      toast.error(
        "Para publicar completá energía, proteínas, carbohidratos y grasas totales por porción."
      )
      return
    }
    const ok = await confirm({
      title: isNew
        ? "¿Estás seguro que desea incorporar una nueva receta?"
        : "¿Estás seguro que desea guardar los cambios de la receta?",
      description: isNew
        ? "La receta quedará disponible en el catálogo."
        : "Se actualizarán los datos de la receta.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
    })
    if (!ok) return
    setSaving(true)
    const tieneNutricion =
      [...CAMPOS_BASICOS, ...CAMPOS_OPCIONALES].some(
        ({ key }) => nutricion[key] !== ""
      ) || fuenteNutricional.trim() !== ""
    const nutricionPayload: NutricionRecetaInput | null = tieneNutricion
      ? {
          ...Object.fromEntries(
            [...CAMPOS_BASICOS, ...CAMPOS_OPCIONALES].map(({ key }) => [
              key,
              nutricion[key] === "" ? null : Number(nutricion[key]),
            ])
          ),
          fuente: fuenteNutricional.trim() || null,
          validada: nutricionValidada && basicosCompletos,
        }
      : null
    const payload: RecetaInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      imagenes,
      tiempo_preparacion:
        tiempoPreparacion === "" ? 0 : Number(tiempoPreparacion),
      porciones: porciones === "" ? 1 : Number(porciones),
      dificultad,
      publica,
      ingredientes: ingredientes
        .filter((i) => i.nombre.trim())
        .map((i) => ({
          nombre: i.nombre.trim(),
          cantidad: i.cantidad === "" ? null : Number(i.cantidad),
          unidad: i.unidad.trim() || null,
          observaciones: i.observaciones.trim() || null,
        })),
      pasos: pasos
        .filter((p) => p.descripcion.trim())
        .map((p) => ({
          descripcion: p.descripcion.trim(),
          tiempo_minutos:
            p.tiempoMinutos === "" ? null : Number(p.tiempoMinutos),
        })),
      categorias: categoriasSeleccionadas,
      nutricion: nutricionPayload,
    }
    try {
      if (isNew) {
        await recipesService.create(payload)
        toast.success("La receta se incorporó con éxito!")
      } else {
        await recipesService.update(Number(id), payload)
        toast.success("Receta actualizada")
      }
      navigate("/recetas")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />

  return (
    <div className="max-w-3xl space-y-4">
      <datalist id="catalogo-ingredientes">
        {catalogoIngredientes.map((i) => (
          <option key={i.id_ingrediente} value={i.nombre} />
        ))}
      </datalist>

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <h1 className="text-brand-dark font-heading text-3xl font-bold">
        {isNew ? "Nueva receta global" : "Editar receta"}
      </h1>

      {imagenes.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[16/7] bg-muted">
            <img
              src={imagenes[Math.min(imagenActiva, imagenes.length - 1)]}
              alt={`Imagen ${Math.min(imagenActiva, imagenes.length - 1) + 1} de ${nombre || "la receta"}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
              {Math.min(imagenActiva, imagenes.length - 1) + 1}/{imagenes.length}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3">
            {imagenes.map((url, index) => (
              <div key={url} className="group relative shrink-0">
                <button
                  type="button"
                  onClick={() => setImagenActiva(index)}
                  className={`h-16 w-24 overflow-hidden rounded-lg border-2 ${
                    index === imagenActiva
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Ver imagen ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImagenes((prev) =>
                      prev.filter((_, itemIndex) => itemIndex !== index)
                    )
                    setImagenActiva((current) =>
                      Math.max(0, Math.min(current, imagenes.length - 2))
                    )
                  }}
                  aria-label={`Quitar imagen ${index + 1}`}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-white shadow"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Nombre
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Imágenes ({imagenes.length}/5)
            </label>
            <div className="flex flex-col gap-1">
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={uploadingImage || imagenes.length >= 5}
                className="text-xs text-muted-foreground file:mr-2 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium"
              />
              {uploadingImage && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Subiendo…
                </span>
              )}
              {imagenes.length >= 5 && (
                <span className="text-xs text-muted-foreground">
                  Alcanzaste el máximo de 5 imágenes.
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Descripción
          </label>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tiempo (min)
            </label>
            <Input
              type="number"
              value={tiempoPreparacion}
              onChange={(e) =>
                setTiempoPreparacion(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Porciones
            </label>
            <Input
              type="number"
              value={porciones}
              onChange={(e) => {
                setPorciones(e.target.value ? Number(e.target.value) : "")
                setNutricionValidada(false)
              }}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Dificultad
            </label>
            <select
              value={dificultad}
              onChange={(e) => setDificultad(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option>Fácil</option>
              <option>Media</option>
              <option>Difícil</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Información nutricional por porción
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Los cuatro valores básicos son obligatorios únicamente para publicar.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            {CAMPOS_BASICOS.map((campo) => (
              <div key={campo.key}>
                <label className="text-[11px] text-muted-foreground">
                  {campo.label} ({campo.unidad})
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={nutricion[campo.key]}
                  onChange={(e) => {
                    setNutricion((prev) => ({
                      ...prev,
                      [campo.key]: e.target.value
                        ? Number(e.target.value)
                        : "",
                    }))
                    setNutricionValidada(false)
                  }}
                  className="rounded-xl"
                />
              </div>
            ))}
          </div>
          {nutrientesOpcionales.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {nutrientesOpcionales.map((key) => {
                const campo = CAMPOS_OPCIONALES.find((item) => item.key === key)
                if (!campo) return null
                return (
                  <div key={key} className="flex items-end gap-1">
                    <div className="flex-1">
                      <label className="text-[11px] text-muted-foreground">
                        {campo.label} ({campo.unidad})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={nutricion[key]}
                        onChange={(e) => {
                          setNutricion((prev) => ({
                            ...prev,
                            [key]: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                          setNutricionValidada(false)
                        }}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setNutrientesOpcionales((prev) =>
                          prev.filter((item) => item !== key)
                        )
                        setNutricion((prev) => ({ ...prev, [key]: "" }))
                        setNutricionValidada(false)
                      }}
                      aria-label={`Quitar ${campo.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <select
              value={nutrienteParaAgregar}
              onChange={(e) => setNutrienteParaAgregar(e.target.value)}
              className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Agregar nutriente opcional…</option>
              {CAMPOS_OPCIONALES.filter(
                ({ key }) => !nutrientesOpcionales.includes(key)
              ).map((campo) => (
                <option key={campo.key} value={campo.key}>
                  {campo.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              disabled={!nutrienteParaAgregar}
              onClick={() => {
                if (!nutrienteParaAgregar) return
                setNutrientesOpcionales((prev) => [
                  ...prev,
                  nutrienteParaAgregar as CampoNutricion,
                ])
                setNutrienteParaAgregar("")
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3">
            <label className="text-[11px] text-muted-foreground">
              Fuente (opcional)
            </label>
            <Input
              value={fuenteNutricional}
              onChange={(e) => {
                setFuenteNutricional(e.target.value)
                setNutricionValidada(false)
              }}
              placeholder="Profesional, herramienta, rótulo u otra referencia"
              className="rounded-xl"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Información validada</p>
              <p className="text-xs text-muted-foreground">
                Los cambios nutricionales vuelven a dejarla pendiente.
              </p>
            </div>
            <Switch
              checked={nutricionValidada}
              disabled={!CAMPOS_BASICOS.every(
                ({ key }) => nutricion[key] !== ""
              )}
              onCheckedChange={setNutricionValidada}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">Receta pública</p>
            <p className="text-xs text-muted-foreground">
              Las recetas no públicas no aparecen en el catálogo general.
            </p>
          </div>
          <Switch checked={publica} onCheckedChange={setPublica} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Categorías / etiquetas
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoriasDisponibles.map((c) => (
              <button
                key={c.id_categoria}
                type="button"
                onClick={() => toggleCategoria(c.nombre)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  categoriasSeleccionadas.includes(c.nombre)
                    ? "border-accent bg-accent text-accent-foreground"
                    : "bg-background"
                }`}
              >
                {c.nombre}
              </button>
            ))}
            {categoriasSeleccionadas
              .filter((c) => !categoriasDisponibles.some((d) => d.nombre === c))
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategoria(c)}
                  className="rounded-full border border-accent bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                >
                  {c} (nueva)
                </button>
              ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  agregarNuevaCategoria()
                }
              }}
              placeholder="Agregar una categoría nueva…"
              className="max-w-xs rounded-xl"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={agregarNuevaCategoria}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold">Ingredientes</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIngredientes((p) => [...p, ingredienteVacio()])
              setNutricionValidada(false)
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Elegí un ingrediente del catálogo o escribí uno nuevo — se agrega
          solo.
        </p>
        {ingredientes.map((ing, i) => {
          const updateIngrediente = (patch: Partial<IngredienteForm>) => {
            setIngredientes((p) =>
              p.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
            )
            setNutricionValidada(false)
          }
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  value={ing.nombre}
                  onChange={(e) =>
                    updateIngrediente({ nombre: e.target.value })
                  }
                  list="catalogo-ingredientes"
                  placeholder="Nombre"
                  className="flex-1 rounded-xl"
                />
                <Input
                  type="number"
                  value={ing.cantidad}
                  onChange={(e) =>
                    updateIngrediente({
                      cantidad: e.target.value ? Number(e.target.value) : "",
                    })
                  }
                  className="w-24 rounded-xl"
                  placeholder="Cant."
                />
                <select
                  value={ing.unidad}
                  onChange={(e) =>
                    updateIngrediente({ unidad: e.target.value })
                  }
                  className="h-10 w-20 rounded-xl border border-input bg-background px-2 text-sm"
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIngredientes((p) => p.filter((_, idx) => idx !== i))
                    setNutricionValidada(false)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </Card>

      <Card className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold">Pasos</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setPasos((p) => [
                ...p,
                {
                  descripcion: "",
                  tiempoMinutos: "",
                  mostrarTiempo: false,
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {pasos.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-6 text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
            <Textarea
              value={s.descripcion}
              onChange={(e) =>
                setPasos((p) =>
                  p.map((x, idx) =>
                    idx === i ? { ...x, descripcion: e.target.value } : x
                  )
                )
              }
              className="flex-1 rounded-xl"
              rows={2}
            />
            <Button
              type="button"
              size="icon"
              variant={s.mostrarTiempo ? "secondary" : "ghost"}
              title={s.mostrarTiempo ? "Quitar tiempo" : "Agregar tiempo"}
              aria-label={s.mostrarTiempo ? "Quitar tiempo" : "Agregar tiempo"}
              onClick={() =>
                setPasos((p) =>
                  p.map((x, idx) =>
                    idx === i
                      ? {
                          ...x,
                          mostrarTiempo: !x.mostrarTiempo,
                          tiempoMinutos: x.mostrarTiempo
                            ? ""
                            : x.tiempoMinutos,
                        }
                      : x
                  )
                )
              }
            >
              <Clock className="h-4 w-4" />
            </Button>
            {s.mostrarTiempo && (
              <div className="relative w-28">
                <Input
                  type="number"
                  min="0"
                  placeholder="Minutos"
                  value={s.tiempoMinutos}
                  onChange={(e) =>
                    setPasos((p) =>
                      p.map((x, idx) =>
                        idx === i
                          ? {
                              ...x,
                              tiempoMinutos: e.target.value
                                ? Number(e.target.value)
                                : "",
                            }
                          : x
                      )
                    )
                  }
                  className="rounded-xl pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  min
                </span>
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPasos((p) => p.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <Button
        onClick={save}
        disabled={saving || uploadingImage}
        className="bg-brand-green hover:bg-brand-green/90 rounded-xl text-white"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="mr-1 h-4 w-4" /> Guardar receta
          </>
        )}
      </Button>
    </div>
  )
}
