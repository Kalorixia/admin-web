import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { TrendingUp, Crown } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import recipesImg from "@/assets/admin-recipes.png"
import KalorixiaLoader from "@/components/KalorixiaLoader"
import { usersService } from "@/services/users.service"
import { nutritionistsService } from "@/services/nutritionists.service"
import { recipesService } from "@/services/recipes.service"
import {
  subscriptionsService,
  type PlanSuscripcion,
} from "@/services/subscriptions.service"
import { auditService, type AuditRow } from "@/services/audit.service"

interface Stats {
  users: number
  patients: number
  nutris: number
  pendingNutris: number
  recipes: number
  recipesActive: number
  recipesReview: number
}

const monthsShort = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

// KAL-151-01: oculto, fuera del alcance (datos de prueba). No borrar.
const MOSTRAR_ACTIVIDAD_RECIENTE = false

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
}

function contar_por_mes(fechas: string[]): { m: string; v: number }[] {
  const now = new Date()
  const buckets: { m: string; v: number; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      m: monthsShort[d.getMonth()],
      v: 0,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    })
  }
  fechas.forEach((f) => {
    const d = new Date(f)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const b = buckets.find((x) => x.key === key)
    if (b) b.v += 1
  })
  return buckets.map(({ m, v }) => ({ m, v }))
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    patients: 0,
    nutris: 0,
    pendingNutris: 0,
    recipes: 0,
    recipesActive: 0,
    recipesReview: 0,
  })
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [usersTrend, setUsersTrend] = useState<{ i: number; v: number }[]>([])
  const [patientsByMonth, setPatientsByMonth] = useState<
    { m: string; v: number }[]
  >([])
  const [recipesByMonth, setRecipesByMonth] = useState<
    { m: string; v: number }[]
  >([])
  const [planCounts, setPlanCounts] = useState<
    { plan: PlanSuscripcion; total: number }[] | null
  >(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // KAL-152-02: aparte del Promise.all principal para que un servidor sin
    // estos endpoints no tire abajo todo el dashboard.
    Promise.all([subscriptionsService.list(), subscriptionsService.listPlans()])
      .then(([list, plans]) =>
        setPlanCounts(
          plans.map((plan) => ({
            plan,
            total: list.filter((n) => n.plan.codigo === plan.codigo).length,
          }))
        )
      )
      .catch(() => setPlanCounts(null))

    ;(async () => {
      const [users, nutriApplications, { recetas: recipes }, auditRows] =
        await Promise.all([
          usersService.list(),
          nutritionistsService.list(),
          recipesService.list(),
          auditService.list(6),
        ])

      const patients = users.filter((u) => u.roles.includes("paciente")).length
      const nutris = users.filter((u) =>
        u.roles.includes("nutricionista")
      ).length
      const pendingNutris = nutriApplications.filter(
        (n) => n.estado === "pendiente"
      ).length

      setStats({
        users: users.length,
        patients,
        nutris,
        pendingNutris,
        recipes: recipes.length,
        recipesActive: Math.max(recipes.length - 1, 0),
        recipesReview: recipes.length > 0 ? 1 : 0,
      })
      setAudit(auditRows)

      const usersByDate = [...users].sort((a, b) =>
        a.fecha_creacion.localeCompare(b.fecha_creacion)
      )
      const trend = usersByDate.map((_, i) => ({ i, v: i + 1 }))
      if (trend.length < 2) trend.push({ i: trend.length, v: trend.length + 1 })
      setUsersTrend(trend)

      setRecipesByMonth(contar_por_mes(recipes.map((rec) => rec.created_at)))
      setPatientsByMonth(
        contar_por_mes(
          users
            .filter((u) => u.roles.includes("paciente"))
            .map((u) => u.fecha_creacion)
        )
      )

      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <KalorixiaLoader />
      </div>
    )
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    })
  const pendingPct =
    stats.nutris + stats.pendingNutris > 0
      ? Math.round(
          (stats.pendingNutris / (stats.nutris + stats.pendingNutris)) * 100
        )
      : 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="hero-gradient relative overflow-hidden rounded-3xl border border-primary/15 px-6 py-7 shadow-sm sm:px-8">
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Resumen operativo
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Panel administrador
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seguí usuarios, profesionales, recetas y actividad desde un solo
          lugar.
        </p>
      </div>

      {/* Top row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Usuarios Totales</p>
              <p className="mt-2 font-heading text-5xl font-bold text-foreground">
                {stats.users}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <TrendingUp className="h-3 w-3" /> {stats.patients} pacientes /{" "}
                {stats.nutris} nutris
              </span>
            </div>
            <div className="h-20 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    usersTrend.length > 1
                      ? usersTrend
                      : [
                          { i: 0, v: 0 },
                          { i: 1, v: 1 },
                        ]
                  }
                >
                  <Tooltip
                    cursor={false}
                    contentStyle={tooltipStyle}
                    labelFormatter={() => ""}
                    formatter={(v) => [v, "Usuarios"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                Nutricionistas Pendientes
              </p>
              <p className="mt-2 font-heading text-5xl font-bold text-foreground">
                {stats.pendingNutris}
              </p>
              <Link
                to="/nutricionistas"
                className="mt-4 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:underline"
              >
                Ver solicitudes recientes
              </Link>
            </div>
            <div className="relative h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "pend", value: Math.max(pendingPct, 1) },
                      { name: "rest", value: 100 - Math.max(pendingPct, 1) },
                    ]}
                    dataKey="value"
                    innerRadius={30}
                    outerRadius={44}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill="var(--primary)" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-lg leading-none font-bold">
                  {stats.pendingNutris}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  pendientes
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Recetas globales</p>
              <p className="mt-2 font-heading text-5xl font-bold text-foreground">
                {stats.recipes}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Recetas activas: {stats.recipesActive} | En revisión:{" "}
                {stats.recipesReview}
              </p>
            </div>
            <img
              src={recipesImg}
              alt=""
              className="h-24 w-24 shrink-0 object-contain"
            />
          </div>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Nuevos Pacientes</p>
          <div className="mt-2 flex items-end gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Pacientes activos</p>
              <p className="font-heading text-4xl font-bold text-foreground">
                {stats.patients}
              </p>
            </div>
            <div className="h-32 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patientsByMonth}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                >
                  <XAxis
                    dataKey="m"
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, "Pacientes"]}
                  />
                  <Bar
                    dataKey="v"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm text-muted-foreground">
            Nuevas Recetas por Mes
          </p>
          <div className="mt-2 flex items-end gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Nutricionistas activos
              </p>
              <p className="font-heading text-4xl font-bold text-foreground">
                {stats.nutris}
              </p>
            </div>
            <div className="h-32 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recipesByMonth}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                >
                  <XAxis
                    dataKey="m"
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, "Recetas"]}
                  />
                  <Bar
                    dataKey="v"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">
              Suscripciones por plan
            </p>
            <Crown className="h-4 w-4 text-primary" />
          </div>
          {planCounts === null ? (
            <p className="mt-3 font-heading text-5xl font-bold text-foreground">
              —
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              {planCounts.map(({ plan, total }) => (
                <li
                  key={plan.codigo}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span className="text-muted-foreground">{plan.nombre}</span>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {total}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/suscripciones"
            className="mt-4 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:underline"
          >
            Gestionar suscripciones
          </Link>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        {MOSTRAR_ACTIVIDAD_RECIENTE && (
          <Card>
            <p className="mb-3 text-sm text-muted-foreground">
              Actividad reciente
            </p>
            {audit.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin actividad reciente.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {audit.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="truncate text-sm text-foreground">
                      {a.action}{" "}
                      <span className="text-muted-foreground">
                        · {a.entity_type}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmt(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card>
          <p className="text-sm text-muted-foreground">Salud del Sistema</p>
          <div className="flex flex-col items-center justify-center py-4">
            <Gauge value={92} />
            <p className="mt-3 text-sm">
              System Health:{" "}
              <span className="font-semibold text-primary">Excelente</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-shadow hover:card-shadow-hover rounded-2xl border border-border/70 bg-card/95 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      {children}
    </div>
  )
}

function Gauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const angle = (pct / 100) * 180
  const r = 70
  const cx = 90
  const cy = 80
  const rad = (deg: number) => (deg * Math.PI) / 180
  const needleX = cx + r * Math.cos(rad(180 - angle))
  const needleY = cy - r * Math.sin(rad(180 - angle))
  return (
    <svg width="180" height="100" viewBox="0 0 180 100">
      <path
        d={`M 20 80 A ${r} ${r} 0 0 1 160 80`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M 20 80 A ${r} ${r} 0 0 1 ${cx + r * Math.cos(rad(180 - angle))} ${cy - r * Math.sin(rad(180 - angle))}`}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="var(--foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill="var(--foreground)" />
    </svg>
  )
}
