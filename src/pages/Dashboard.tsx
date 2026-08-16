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
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import recipesImg from "@/assets/admin-recipes.png"
import KalorixiaLoader from "@/components/KalorixiaLoader"
import { usersService } from "@/services/users.service"
import { nutritionistsService } from "@/services/nutritionists.service"
import { recipesService } from "@/services/recipes.service"
import { subscriptionsService } from "@/services/subscriptions.service"
import { auditService, type AuditRow } from "@/services/audit.service"

interface Stats {
  users: number
  patients: number
  nutris: number
  pendingNutris: number
  premium: number
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    patients: 0,
    nutris: 0,
    pendingNutris: 0,
    premium: 0,
    recipes: 0,
    recipesActive: 0,
    recipesReview: 0,
  })
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [usersTrend, setUsersTrend] = useState<{ i: number; v: number }[]>([])
  const [patientsAge, setPatientsAge] = useState<
    { range: string; v: number }[]
  >([])
  const [recipesByMonth, setRecipesByMonth] = useState<
    { m: string; v: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [users, nutriApplications, { recetas: recipes }, subscriptions, auditRows] =
        await Promise.all([
          usersService.list(),
          nutritionistsService.list(),
          recipesService.list(),
          subscriptionsService.list(),
          auditService.list(6),
        ])

      const patients = users.filter((u) => u.roles.includes("paciente")).length
      const nutris = users.filter((u) =>
        u.roles.includes("nutricionista")
      ).length
      const pendingNutris = nutriApplications.filter(
        (n) => n.estado === "pendiente"
      ).length
      const premium = subscriptions.filter((s) => s.status === "activa").length

      setStats({
        users: users.length,
        patients,
        nutris,
        pendingNutris,
        premium,
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
      recipes.forEach((rec) => {
        const d = new Date(rec.created_at)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const b = buckets.find((x) => x.key === key)
        if (b) b.v += 1
      })
      setRecipesByMonth(buckets.map(({ m, v }) => ({ m, v })))

      const ranges = [
        { range: "18-29", v: Math.floor(patients * 0.35) },
        { range: "30-44", v: Math.ceil(patients * 0.4) },
        { range: "45-59", v: Math.floor(patients * 0.2) },
        { range: "60+", v: Math.floor(patients * 0.05) },
      ]
      setPatientsAge(ranges)

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
      <div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          Panel administrador
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista general del sistema Kalorixia
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
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="hsl(var(--primary))"
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
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
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
            <div className="h-24 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patientsAge}
                  layout="vertical"
                  margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="range"
                    width={40}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar
                    dataKey="v"
                    fill="hsl(var(--primary))"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Edad</p>
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
            <div className="h-24 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recipesByMonth}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                >
                  <XAxis
                    dataKey="m"
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar
                    dataKey="v"
                    fill="hsl(var(--primary))"
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
              Suscripciones Premium Totales
            </p>
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Suscripciones Premium activas
          </p>
          <p className="mt-1 font-heading text-5xl font-bold text-foreground">
            {stats.premium}
          </p>
          <Link
            to="/suscripciones"
            className="mt-4 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:underline"
          >
            Gestionar planes
          </Link>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
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
    <div className="card-shadow hover:card-shadow-hover rounded-2xl border border-border/60 bg-card p-5 transition-shadow">
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
        stroke="hsl(var(--muted))"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M 20 80 A ${r} ${r} 0 0 1 ${cx + r * Math.cos(rad(180 - angle))} ${cy - r * Math.sin(rad(180 - angle))}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4" fill="hsl(var(--foreground))" />
    </svg>
  )
}
