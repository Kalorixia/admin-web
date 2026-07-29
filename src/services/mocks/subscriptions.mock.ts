export interface SubscriptionRow {
  id: string
  user_id: string
  plan_id: string | null
  plan_name: string
  status: "activa" | "cancelada" | "vencida"
  started_at: string
  next_charge_at: string | null
  payment_status: "pagado" | "pendiente" | "vencido" | null
  patients_active: number
  profile: { full_name: string | null; email: string | null }
}

export const subscriptionRows: SubscriptionRow[] = [
  {
    id: "sub_1",
    user_id: "nutri_1",
    plan_id: "plan_pro",
    plan_name: "Pro",
    status: "activa",
    started_at: "2026-02-01T00:00:00.000Z",
    next_charge_at: "2026-08-01T00:00:00.000Z",
    payment_status: "pagado",
    patients_active: 24,
    profile: {
      full_name: "Lucía Fernández",
      email: "lucia.fernandez@example.com",
    },
  },
  {
    id: "sub_2",
    user_id: "nutri_2",
    plan_id: "plan_starter",
    plan_name: "Starter",
    status: "activa",
    started_at: "2026-04-10T00:00:00.000Z",
    next_charge_at: "2026-08-10T00:00:00.000Z",
    payment_status: "pendiente",
    patients_active: 9,
    profile: { full_name: "Sofía Romero", email: "sofia.romero@example.com" },
  },
  {
    id: "sub_3",
    user_id: "nutri_3",
    plan_id: "plan_elite",
    plan_name: "Elite",
    status: "vencida",
    started_at: "2025-11-01T00:00:00.000Z",
    next_charge_at: "2026-07-01T00:00:00.000Z",
    payment_status: "vencido",
    patients_active: 3,
    profile: {
      full_name: "Ezequiel Torres",
      email: "ezequiel.torres@example.com",
    },
  },
  {
    id: "sub_4",
    user_id: "nutri_4",
    plan_id: "plan_starter",
    plan_name: "Starter",
    status: "cancelada",
    started_at: "2025-09-01T00:00:00.000Z",
    next_charge_at: null,
    payment_status: null,
    patients_active: 0,
    profile: { full_name: "Marina Castro", email: null },
  },
]
