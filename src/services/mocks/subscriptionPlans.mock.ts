export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  max_patients: number
  ai_limit: number
  features: string[]
  active: boolean
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    description: "Para nutricionistas que están empezando.",
    price_monthly: 9.99,
    max_patients: 15,
    ai_limit: 20,
    features: [
      "Hasta 15 pacientes activos",
      "Consumo limitado de IA",
      "Soporte por email",
    ],
    active: true,
  },
  {
    id: "plan_pro",
    name: "Pro",
    description: "El plan más elegido por consultorios en crecimiento.",
    price_monthly: 24.99,
    max_patients: 60,
    ai_limit: 100,
    features: [
      "Hasta 60 pacientes activos",
      "Consumo ampliado de IA",
      "Planes de alimentación ilimitados",
      "Soporte prioritario",
    ],
    active: true,
  },
  {
    id: "plan_elite",
    name: "Elite",
    description: "Para equipos y consultorios con muchos pacientes.",
    price_monthly: 49.99,
    max_patients: 200,
    ai_limit: 400,
    features: [
      "Pacientes ilimitados (hasta 200)",
      "Consumo de IA sin límites prácticos",
      "Reportes avanzados",
      "Soporte dedicado",
    ],
    active: true,
  },
  {
    id: "plan_legacy",
    name: "Legacy",
    description: "Plan anterior, ya no se ofrece a nuevos usuarios.",
    price_monthly: 14.99,
    max_patients: 30,
    ai_limit: 50,
    features: ["Hasta 30 pacientes activos"],
    active: false,
  },
]
